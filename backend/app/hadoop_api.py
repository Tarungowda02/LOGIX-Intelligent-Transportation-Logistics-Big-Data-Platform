from fastapi import APIRouter, HTTPException
from pathlib import Path

router = APIRouter(prefix="/api/hadoop", tags=["Hadoop Analytics"])

HADOOP_OUTPUT = Path.home() / "LOGIX" / "hadoop" / "output"


def read_output(folder):
    file_path = HADOOP_OUTPUT / folder / "part-r-00000"

    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Hadoop output not found: {file_path}"
        )

    with open(file_path, "r") as file:
        return [line.strip() for line in file if line.strip()]


def parse_values(data):
    return dict(
        item.split("=", 1)
        for item in data.split(", ")
        if "=" in item
    )


def parse_route(line):
    route_id, data = line.split("\t", 1)
    values = parse_values(data)

    return {
        "route_id": route_id,
        "origin": values.get("origin"),
        "destination": values.get("destination"),
        "distance_km": float(values.get("distance_km", 0)),
        "historical_delay_rate": float(values.get("historical_delay_rate", 0)),
        "average_speed": float(values.get("average_speed", 0)),
        "route_rating": float(values.get("route_rating", 0)),
        "efficiency_score": float(values.get("efficiency_score", 0)),
        "efficiency_level": values.get("efficiency_level"),
        "risk_level": values.get("risk_level"),
    }


def parse_shipment(line):
    route_id, data = line.split("\t", 1)
    values = parse_values(data)

    return {
        "route_id": route_id,
        "shipments": int(values.get("shipments", 0)),
        "delayed": int(values.get("delayed", 0)),
        "avg_delay": float(values.get("avg_delay", 0)),
        "max_delay": float(values.get("max_delay", 0)),
        "on_time_pct": float(values.get("on_time_pct", 0)),
    }


def parse_vehicle(line):
    vehicle_id, data = line.split("\t", 1)
    values = parse_values(data)

    return {
        "vehicle_id": vehicle_id,
        "vehicle_type": values.get("type"),
        "fuel_type": values.get("fuel"),
        "capacity_kg": float(values.get("capacity_kg", 0)),
        "mileage": float(values.get("mileage", 0)),
        "maintenance_status": values.get("maintenance"),
        "vehicle_age": int(values.get("age", 0)),
        "performance_score": float(values.get("performance_score", 0)),
        "performance_level": values.get("performance_level"),
    }


@router.get("/routes")
def hadoop_routes():
    rows = [parse_route(line) for line in read_output("routes")]

    return {
        "source": "Hadoop MapReduce",
        "analysis": "Route Performance",
        "count": len(rows),
        "routes": rows,
    }


@router.get("/shipments")
def hadoop_shipments():
    rows = [parse_shipment(line) for line in read_output("shipments")]

    return {
        "source": "Hadoop MapReduce",
        "analysis": "Shipment Delay",
        "count": len(rows),
        "shipments": rows,
    }


@router.get("/vehicles")
def hadoop_vehicles():
    rows = [parse_vehicle(line) for line in read_output("vehicles")]

    return {
        "source": "Hadoop MapReduce",
        "analysis": "Vehicle Performance",
        "count": len(rows),
        "vehicles": rows,
    }


@router.get("/overview")
def hadoop_overview():
    routes = [parse_route(line) for line in read_output("routes")]
    shipments = [parse_shipment(line) for line in read_output("shipments")]
    vehicles = [parse_vehicle(line) for line in read_output("vehicles")]

    high_risk_routes = sum(
        1 for route in routes
        if route["risk_level"] == "High"
    )

    excellent_vehicles = sum(
        1 for vehicle in vehicles
        if vehicle["performance_level"] == "Excellent"
    )

    poor_vehicles = sum(
        1 for vehicle in vehicles
        if vehicle["performance_level"] == "Poor"
    )

    total_shipments = sum(
        shipment["shipments"]
        for shipment in shipments
    )

    total_delayed = sum(
        shipment["delayed"]
        for shipment in shipments
    )

    average_on_time = round(
        sum(s["on_time_pct"] for s in shipments) / len(shipments),
        2
    ) if shipments else 0

    return {
        "engine": "Hadoop MapReduce",
        "status": "online",
        "routes": {
            "total": len(routes),
            "high_risk": high_risk_routes,
        },
        "shipments": {
            "total": total_shipments,
            "delayed": total_delayed,
            "on_time_percentage": average_on_time,
        },
        "vehicles": {
            "total": len(vehicles),
            "excellent": excellent_vehicles,
            "poor": poor_vehicles,
        },
    }
