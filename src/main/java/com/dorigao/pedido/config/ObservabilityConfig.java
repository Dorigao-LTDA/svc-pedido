package com.dorigao.pedido.config;

import io.micrometer.core.instrument.Tags;
import io.micrometer.core.instrument.config.MeterFilter;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ObservabilityConfig {

    @Bean
    public HealthIndicator customHealthIndicator() {
        return () -> Health.up()
                .withDetail("service", "pedido")
                .withDetail("version", "1.0.0")
                .build();
    }

    @Bean
    public MeterFilter commonTagsFilter() {
        return MeterFilter.commonTags(
                Tags.of("application", "pedido",
                        "service.name", "pedido",
                        "service.namespace", "app",
                        "service_name", "pedido")
        );
    }
}
