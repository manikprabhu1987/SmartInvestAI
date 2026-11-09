# Build Stage
FROM maven:3.9.9-eclipse-temurin-21 AS build

WORKDIR /app

COPY pom.xml .
COPY src ./src

RUN mvn clean package -DskipTests

# Runtime Stage
FROM eclipse-temurin:21-jre

RUN useradd -r springuser

WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

USER springuser

EXPOSE 8080

ENTRYPOINT ["java","-jar","app.jar"]