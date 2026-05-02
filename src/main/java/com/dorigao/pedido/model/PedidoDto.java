package com.dorigao.pedido.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record PedidoDto(
    UUID id,
    @NotEmpty List<String> itens,
    @Positive BigDecimal valorTotal,
    String status,
    String cliente,
    Instant createdAt,
    Instant updatedAt
) {
    public static PedidoDto criar(List<String> itens, String cliente) {
        var agora = Instant.now();
        return new PedidoDto(
            UUID.randomUUID(),
            itens,
            BigDecimal.ZERO,
            "CRIADO",
            cliente,
            agora,
            agora
        );
    }
}
