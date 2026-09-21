from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import pandas as pd
import io
from app.hadoop_api import router as hadoop_router

app = FastAPI(
    title="LOGIX API",
    description="Intelligent Transportation & Logistics Big Data Platform",
    version="1.0.0"
)

app.include_router(hadoop_router)

# Allow React frontend to communicate with FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        "http://localhost:5173",
        "http://localhost:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------
# SAMPLE DATA
# ---------------------------------------------------------

SHIPMENTS = [
    {
        "shipment_id": "LOG-10241",
        "vehicle_id": "KA 01 AB 4582",
        "origin": "Bangalore",
        "destination": "Chennai",
        "distance_km": 347,
        "weight_kg": 8200,
        "priority": "High",
        "status": "In Transit",
        "delay_minutes": 18
    },
    {
        "shipment_id": "LOG-10242",
        "vehicle_id": "MH 12 QR 9011",
        "origin": "Mumbai",
        "destination": "Pune",
        "distance_km": 150,
        "weight_kg": 5200,
        "priority": "Medium",
        "status": "Delivered",
        "delay_minutes": 0
    },
    {
        "shipment_id": "LOG-10243",
        "vehicle_id": "TS 09 KL 3374",
        "origin": "Hyderabad",
        "destination": "Bangalore",
        "distance_km": 570,
        "weight_kg": 7600,
        "priority": "High",
        "status": "In Transit",
        "delay_minutes": 8
    },
    {
        "shipment_id": "LOG-10244",
        "vehicle_id": "DL 01 CX 7821",
        "origin": "Delhi",
        "destination": "Jaipur",
        "distance_km": 281,
        "weight_kg": 4100,
        "priority": "Low",
        "status": "Delivered",
        "delay_minutes": 4
    },
    {
        "shipment_id": "LOG-10245",
        "vehicle_id": "KA 05 MN 6248",
        "origin": "Chennai",
        "destination": "Hyderabad",
        "distance_km": 626,
        "weight_kg": 6800,
        "priority": "High",
        "status": "Delayed",
        "delay_minutes": 23
    }
]


VEHICLES = [
    {
        "vehicle_id": "KA 01 AB 4582",
        "vehicle_type": "Truck",
        "capacity_kg": 12000,
        "fuel_type": "Diesel",
        "mileage": 4.8,
        "maintenance_status": "Good",
        "vehicle_age": 3
    },
    {
        "vehicle_id": "MH 12 QR 9011",
        "vehicle_type": "Van",
        "capacity_kg": 7000,
        "fuel_type": "Diesel",
        "mileage": 8.2,
        "maintenance_status": "Excellent",
        "vehicle_age": 2
    },
    {
        "vehicle_id": "TS 09 KL 3374",
        "vehicle_type": "Truck",
        "capacity_kg": 10000,
        "fuel_type": "Diesel",
        "mileage": 5.4,
        "maintenance_status": "Good",
        "vehicle_age": 4
    },
    {
        "vehicle_id": "DL 01 CX 7821",
        "vehicle_type": "Mini Truck",
        "capacity_kg": 6000,
        "fuel_type": "CNG",
        "mileage": 9.1,
        "maintenance_status": "Excellent",
        "vehicle_age": 2
    },
    {
        "vehicle_id": "KA 05 MN 6248",
        "vehicle_type": "Truck",
        "capacity_kg": 9000,
        "fuel_type": "Diesel",
        "mileage": 4.2,
        "maintenance_status": "Needs Service",
        "vehicle_age": 6
    }
]


ROUTES = [
    {
        "route_id": "RT-001",
        "origin": "Bangalore",
        "destination": "Chennai",
        "distance_km": 347,
        "historical_delay_rate": 18,
        "average_speed": 58,
        "route_rating": 4.1
    },
    {
        "route_id": "RT-002",
        "origin": "Mumbai",
        "destination": "Pune",
        "distance_km": 150,
        "historical_delay_rate": 9,
        "average_speed": 64,
        "route_rating": 4.5
    },
    {
        "route_id": "RT-003",
        "origin": "Hyderabad",
        "destination": "Bangalore",
        "distance_km": 570,
        "historical_delay_rate": 14,
        "average_speed": 61,
        "route_rating": 4.2
    },
    {
        "route_id": "RT-004",
        "origin": "Delhi",
        "destination": "Jaipur",
        "distance_km": 281,
        "historical_delay_rate": 11,
        "average_speed": 63,
        "route_rating": 4.3
    },
    {
        "route_id": "RT-005",
        "origin": "Chennai",
        "destination": "Hyderabad",
        "distance_km": 626,
        "historical_delay_rate": 22,
        "average_speed": 55,
        "route_rating": 3.9
    }
]


# ---------------------------------------------------------
# BASIC ENDPOINTS
# ---------------------------------------------------------

@app.get("/")
def root():
    return {
        "project": "LOGIX",
        "message": "LOGIX Backend API is running",
        "status": "online"
    }


@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "service": "LOGIX API"
    }


# ---------------------------------------------------------
# DASHBOARD
# ---------------------------------------------------------

@app.get("/api/dashboard")
def dashboard():

    total_shipments = len(SHIPMENTS)
    delivered = sum(
        1 for shipment in SHIPMENTS
        if shipment["status"] == "Delivered"
    )
    delayed = sum(
        1 for shipment in SHIPMENTS
        if shipment["status"] == "Delayed"
    )
    in_transit = sum(
        1 for shipment in SHIPMENTS
        if shipment["status"] == "In Transit"
    )

    average_delay = round(
        sum(s["delay_minutes"] for s in SHIPMENTS) / total_shipments,
        2
    )

    return {
        "total_shipments": total_shipments,
        "delivered": delivered,
        "delayed": delayed,
        "in_transit": in_transit,
        "average_delay_minutes": average_delay,
        "fleet_size": len(VEHICLES),
        "routes": len(ROUTES)
    }


# ---------------------------------------------------------
# SHIPMENTS
# ---------------------------------------------------------

@app.get("/api/shipments")
def get_shipments(
    status: Optional[str] = None,
    priority: Optional[str] = None
):

    data = SHIPMENTS

    if status:
        data = [
            shipment for shipment in data
            if shipment["status"].lower() == status.lower()
        ]

    if priority:
        data = [
            shipment for shipment in data
            if shipment["priority"].lower() == priority.lower()
        ]

    return {
        "count": len(data),
        "shipments": data
    }


# ---------------------------------------------------------
# FLEET
# ---------------------------------------------------------

@app.get("/api/fleet")
def get_fleet():

    return {
        "count": len(VEHICLES),
        "vehicles": VEHICLES
    }


# ---------------------------------------------------------
# ROUTES
# ---------------------------------------------------------

@app.get("/api/routes")
def get_routes():

    return {
        "count": len(ROUTES),
        "routes": ROUTES
    }


# ---------------------------------------------------------
# LOGISTICS RISK SCORE
# ---------------------------------------------------------

@app.get("/api/risk")
def get_risk():

    risk_data = []

    for shipment in SHIPMENTS:

        delay_factor = min(
            shipment["delay_minutes"] * 2,
            40
        )

        priority_factor = {
            "High": 20,
            "Medium": 10,
            "Low": 5
        }.get(shipment["priority"], 5)

        vehicle = next(
            (
                v for v in VEHICLES
                if v["vehicle_id"] == shipment["vehicle_id"]
            ),
            None
        )

        vehicle_factor = 0

        if vehicle:
            if vehicle["maintenance_status"] == "Needs Service":
                vehicle_factor = 20
            elif vehicle["maintenance_status"] == "Good":
                vehicle_factor = 8
            else:
                vehicle_factor = 3

        risk_score = min(
            round(
                delay_factor +
                priority_factor +
                vehicle_factor
            ),
            100
        )

        if risk_score <= 30:
            level = "Low"
        elif risk_score <= 60:
            level = "Moderate"
        else:
            level = "High"

        risk_data.append({
            "shipment_id": shipment["shipment_id"],
            "risk_score": risk_score,
            "risk_level": level,
            "delay_factor": delay_factor,
            "priority_factor": priority_factor,
            "vehicle_factor": vehicle_factor
        })

    return {
        "risk_data": risk_data
    }


# ---------------------------------------------------------
# WHAT-IF SIMULATOR
# ---------------------------------------------------------

class SimulationRequest(BaseModel):
    traffic: float = 50
    dispatch_delay: float = 0
    vehicle_efficiency: float = 100


@app.post("/api/simulator")
def simulator(request: SimulationRequest):

    traffic_factor = request.traffic * 0.35
    dispatch_factor = request.dispatch_delay * 1.5
    efficiency_factor = (100 - request.vehicle_efficiency) * 0.25

    predicted_delay = round(
        traffic_factor +
        dispatch_factor +
        efficiency_factor,
        2
    )

    risk_score = min(
        round(predicted_delay * 1.5),
        100
    )

    efficiency_score = max(
        round(
            100 -
            request.traffic * 0.25 -
            (100 - request.vehicle_efficiency) * 0.5,
            2
        ),
        0
    )

    return {
        "predicted_delay_minutes": predicted_delay,
        "risk_score": risk_score,
        "efficiency_score": efficiency_score
    }


# ---------------------------------------------------------
# DATA INGESTION
# ---------------------------------------------------------

@app.post("/api/ingest")
async def ingest_file(file: UploadFile = File(...)):

    contents = await file.read()

    try:
        df = pd.read_csv(io.BytesIO(contents))

        return {
            "status": "success",
            "filename": file.filename,
            "records": len(df),
            "columns": list(df.columns)
        }

    except Exception as error:

        return {
            "status": "error",
            "message": str(error)
        }