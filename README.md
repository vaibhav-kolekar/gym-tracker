# Gym Tracker

A Spring Boot web app for tracking gym progress. It stores exercise name, muscle group, weight, repetitions, sets, workout date, and notes. Authentication is intentionally not included yet.

## Run Locally

Install Java 21 and Maven, then run:

```bash
mvn spring-boot:run
```

Open:

```text
http://localhost:8080
```

The default database is a local H2 file at `./data/gym-tracker`, so you can start without installing MySQL.

## API

```text
GET    /api/exercises
GET    /api/exercises/{id}
POST   /api/exercises
PUT    /api/exercises/{id}
DELETE /api/exercises/{id}
```

Example body:

```json
{
  "name": "Bench press",
  "muscleGroup": "Chest",
  "weightKg": 60,
  "repetitions": 8,
  "sets": 3,
  "performedOn": "2026-06-26",
  "notes": "Felt strong"
}
```

## Cloud Configuration

The app reads configuration from environment variables:

```text
PORT=8080
DATABASE_URL=jdbc:mysql://your-host:3306/gym_tracker
DATABASE_USERNAME=your_user
DATABASE_PASSWORD=your_password
DATABASE_DRIVER=com.mysql.cj.jdbc.Driver
DDL_AUTO=update
H2_CONSOLE=false
```

Build a deployable jar:

```bash
mvn clean package
```

Run it:

```bash
java -jar target/gym-tracker-0.0.1-SNAPSHOT.jar
```
