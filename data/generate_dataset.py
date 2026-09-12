import csv
import random
from datetime import datetime, timedelta
from pathlib import Path

random.seed(42)

BASE_DIR = Path(__file__).resolve().parent / "raw"
BASE_DIR.mkdir(parents=True, exist_ok=True)

NUM_SHIPMENTS = 100_000
NUM_VEHICLES = 2_000
NUM_ROUTES = 500
NUM_WAREHOUSES = 100

cities = [
    "Bangalore", "Chennai", "Hyderabad", "Mumbai", "Pune",
    "Delhi", "Jaipur", "Kolkata", "Ahmedabad", "Kochi",
    "Coimbatore", "Mysore", "Nagpur", "Indore", "Surat",
    "Lucknow", "Bhopal", "Visakhapatnam", "Patna", "Gurgaon"
]

vehicle_types = ["Truck", "Mini Truck", "Van", "Container"]
fuel_types = ["Diesel", "CNG", "Electric"]

priorities = ["Low", "Medium", "High", "Critical"]
statuses = ["Delivered", "In Transit", "Delayed"]

weather_conditions = [
    "Clear", "Cloudy", "Rain", "Heavy Rain", "Fog"
]

delivery_reasons = [
    "Traffic",
    "Weather",
    "Vehicle Issue",
    "Warehouse Delay",
    "Customer Unavailable",
    "Route Congestion",
    "None"
]


def write_csv(filename, fieldnames, rows):
    path = BASE_DIR / filename

    with open(path, "w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"Created {filename}: {len(rows):,} records")


# ---------------------------------------------------------
# VEHICLES
# ---------------------------------------------------------

vehicles = []

for i in range(1, NUM_VEHICLES + 1):
    vehicle_id = f"VH-{i:05d}"

    vehicle_type = random.choice(vehicle_types)
    fuel_type = random.choice(fuel_types)

    if vehicle_type == "Truck":
        capacity = random.choice([8000, 10000, 12000, 15000, 20000])
    elif vehicle_type == "Mini Truck":
        capacity = random.choice([3000, 4000, 5000, 6000])
    elif vehicle_type == "Van":
        capacity = random.choice([1000, 2000, 3000, 5000])
    else:
        capacity = random.choice([15000, 20000, 25000])

    mileage = round(random.uniform(3.5, 12.0), 2)

    maintenance_status = random.choices(
        ["Excellent", "Good", "Warning", "Needs Service"],
        weights=[20, 55, 18, 7]
    )[0]

    vehicle_age = random.randint(1, 12)

    vehicles.append({
        "vehicle_id": vehicle_id,
        "vehicle_type": vehicle_type,
        "capacity_kg": capacity,
        "fuel_type": fuel_type,
        "mileage": mileage,
        "maintenance_status": maintenance_status,
        "vehicle_age": vehicle_age
    })

write_csv(
    "vehicles.csv",
    [
        "vehicle_id",
        "vehicle_type",
        "capacity_kg",
        "fuel_type",
        "mileage",
        "maintenance_status",
        "vehicle_age"
    ],
    vehicles
)


# ---------------------------------------------------------
# ROUTES
# ---------------------------------------------------------

routes = []

for i in range(1, NUM_ROUTES + 1):
    origin, destination = random.sample(cities, 2)

    distance = random.randint(50, 1500)

    delay_rate = round(random.uniform(3, 35), 2)

    average_speed = round(
        random.uniform(35, 80),
        2
    )

    route_rating = round(
        random.uniform(2.5, 5.0),
        1
    )

    routes.append({
        "route_id": f"RT-{i:04d}",
        "origin": origin,
        "destination": destination,
        "distance_km": distance,
        "historical_delay_rate": delay_rate,
        "average_speed": average_speed,
        "route_rating": route_rating
    })

write_csv(
    "routes.csv",
    [
        "route_id",
        "origin",
        "destination",
        "distance_km",
        "historical_delay_rate",
        "average_speed",
        "route_rating"
    ],
    routes
)


# ---------------------------------------------------------
# WAREHOUSES
# ---------------------------------------------------------

warehouses = []

for i in range(1, NUM_WAREHOUSES + 1):
    city = random.choice(cities)

    warehouses.append({
        "warehouse_id": f"WH-{i:04d}",
        "location": city,
        "inventory_level": random.randint(100, 10000),
        "inbound_volume": random.randint(50, 2000),
        "outbound_volume": random.randint(50, 2000),
        "processing_time": round(random.uniform(10, 180), 2)
    })

write_csv(
    "warehouses.csv",
    [
        "warehouse_id",
        "location",
        "inventory_level",
        "inbound_volume",
        "outbound_volume",
        "processing_time"
    ],
    warehouses
)


# ---------------------------------------------------------
# SHIPMENTS
# ---------------------------------------------------------

shipments = []

start_date = datetime(2025, 1, 1)

for i in range(1, NUM_SHIPMENTS + 1):

    route = random.choice(routes)
    vehicle = random.choice(vehicles)

    dispatch = start_date + timedelta(
        minutes=random.randint(0, 365 * 24 * 60)
    )

    distance = route["distance_km"]

    expected_hours = max(
        2,
        distance / route["average_speed"]
    )

    expected_delivery = dispatch + timedelta(
        hours=expected_hours
    )

    delay = max(
        0,
        int(random.gauss(
            route["historical_delay_rate"],
            15
        ))
    )

    actual_delivery = expected_delivery + timedelta(
        minutes=delay
    )

    priority = random.choices(
        priorities,
        weights=[40, 40, 15, 5]
    )[0]

    status = random.choices(
        statuses,
        weights=[65, 15, 20]
    )[0]

    weight = random.randint(
        500,
        min(vehicle["capacity_kg"], 15000)
    )

    shipments.append({
        "shipment_id": f"LOG-{i:06d}",
        "vehicle_id": vehicle["vehicle_id"],
        "route_id": route["route_id"],
        "origin": route["origin"],
        "destination": route["destination"],
        "distance_km": distance,
        "weight_kg": weight,
        "priority": priority,
        "dispatch_time": dispatch.strftime("%Y-%m-%d %H:%M:%S"),
        "expected_delivery": expected_delivery.strftime("%Y-%m-%d %H:%M:%S"),
        "actual_delivery": actual_delivery.strftime("%Y-%m-%d %H:%M:%S"),
        "status": status,
        "delay_minutes": delay
    })

write_csv(
    "shipments.csv",
    [
        "shipment_id",
        "vehicle_id",
        "route_id",
        "origin",
        "destination",
        "distance_km",
        "weight_kg",
        "priority",
        "dispatch_time",
        "expected_delivery",
        "actual_delivery",
        "status",
        "delay_minutes"
    ],
    shipments
)


# ---------------------------------------------------------
# TRIPS
# ---------------------------------------------------------

trips = []

for i in range(1, NUM_SHIPMENTS + 1):

    shipment = shipments[i - 1]

    vehicle_id = shipment["vehicle_id"]
    distance = shipment["distance_km"]

    start_time = datetime.strptime(
        shipment["dispatch_time"],
        "%Y-%m-%d %H:%M:%S"
    )

    duration = distance / random.uniform(35, 70)

    end_time = start_time + timedelta(hours=duration)

    vehicle = next(
        v for v in vehicles
        if v["vehicle_id"] == vehicle_id
    )

    fuel_used = round(
        distance / vehicle["mileage"],
        2
    )

    trips.append({
        "trip_id": f"TR-{i:06d}",
        "vehicle_id": vehicle_id,
        "route_id": shipment["route_id"],
        "start_time": start_time.strftime("%Y-%m-%d %H:%M:%S"),
        "end_time": end_time.strftime("%Y-%m-%d %H:%M:%S"),
        "distance_km": distance,
        "fuel_used_liters": fuel_used
    })

write_csv(
    "trips.csv",
    [
        "trip_id",
        "vehicle_id",
        "route_id",
        "start_time",
        "end_time",
        "distance_km",
        "fuel_used_liters"
    ],
    trips
)


# ---------------------------------------------------------
# DELIVERIES
# ---------------------------------------------------------

deliveries = []

for shipment in shipments:

    delay = shipment["delay_minutes"]

    if delay == 0:
        delivery_status = "On Time"
    elif delay < 30:
        delivery_status = "Late"
    else:
        delivery_status = "Severely Late"

    reason = (
        "None"
        if delay == 0
        else random.choice(delivery_reasons[:-1])
    )

    deliveries.append({
        "shipment_id": shipment["shipment_id"],
        "delivery_attempt": random.randint(1, 2),
        "delivery_status": delivery_status,
        "delay_minutes": delay,
        "reason": reason
    })

write_csv(
    "deliveries.csv",
    [
        "shipment_id",
        "delivery_attempt",
        "delivery_status",
        "delay_minutes",
        "reason"
    ],
    deliveries
)


# ---------------------------------------------------------
# TRAFFIC
# ---------------------------------------------------------

traffic = []

for route in routes:

    for day in range(1, 31):

        timestamp = start_date + timedelta(days=day)

        congestion = random.randint(10, 100)

        traffic.append({
            "location": route["origin"],
            "timestamp": timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            "congestion_level": congestion,
            "average_speed": round(
                random.uniform(20, 75),
                2
            ),
            "traffic_volume": random.randint(
                500,
                10000
            )
        })

write_csv(
    "traffic.csv",
    [
        "location",
        "timestamp",
        "congestion_level",
        "average_speed",
        "traffic_volume"
    ],
    traffic
)


# ---------------------------------------------------------
# WEATHER
# ---------------------------------------------------------

weather = []

for city in cities:

    for day in range(1, 31):

        timestamp = start_date + timedelta(days=day)

        condition = random.choice(
            weather_conditions
        )

        rainfall = (
            random.uniform(10, 100)
            if "Rain" in condition
            else random.uniform(0, 10)
        )

        weather.append({
            "location": city,
            "timestamp": timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            "temperature": round(
                random.uniform(15, 40),
                2
            ),
            "rainfall_mm": round(
                rainfall,
                2
            ),
            "visibility_km": round(
                random.uniform(2, 15),
                2
            ),
            "weather_condition": condition
        })

write_csv(
    "weather.csv",
    [
        "location",
        "timestamp",
        "temperature",
        "rainfall_mm",
        "visibility_km",
        "weather_condition"
    ],
    weather
)


print("\n====================================")
print("LOGIX DATASET GENERATION COMPLETE")
print("====================================")
print(f"Shipments : {len(shipments):,}")
print(f"Vehicles  : {len(vehicles):,}")
print(f"Routes    : {len(routes):,}")
print(f"Trips     : {len(trips):,}")
print(f"Deliveries: {len(deliveries):,}")
print(f"Traffic   : {len(traffic):,}")
print(f"Weather   : {len(weather):,}")
print(f"Warehouses: {len(warehouses):,}")
print("====================================")

