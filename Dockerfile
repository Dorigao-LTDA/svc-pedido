# Build stage
FROM maven:3.9-eclipse-temurin-25 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests -B

# Run stage
FROM eclipse-temurin:25-jre-alpine

# Non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

WORKDIR /app

# Copy JAR with layers for cache optimization
COPY --from=build /app/target/app.jar /app/app.jar

# Health check
HEALTHCHECK --interval=15s --timeout=3s --start-period=30s --retries=3 \
    CMD wget -qO- http://localhost:8080/health/readiness || exit 1

# Expose port
EXPOSE 8080

# Graceful shutdown support
STOPSIGNAL SIGTERM

# JVM Args (configuráveis via JAVA_OPTS env var)
ENTRYPOINT exec java \
    -XX:+UseZGC \
    -XX:MaxRAMPercentage=75.0 \
    -XX:+ExitOnOutOfMemoryError \
    -Djava.security.egd=file:/dev/./urandom \
    ${JAVA_OPTS} \
    -jar /app/app.jar
