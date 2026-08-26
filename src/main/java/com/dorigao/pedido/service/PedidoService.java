package com.dorigao.pedido.service;

import com.dorigao.pedido.model.PedidoDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PedidoService {

    private static final Logger log = LoggerFactory.getLogger(PedidoService.class);
    private final Map<UUID, PedidoDto> pedidos = new ConcurrentHashMap<>();

    public PedidoService() {
        seed();
        log.info("PedidoService inicializado com {} pedidos seed", pedidos.size());
    }

    public List<PedidoDto> listarTodos() {
        log.debug("Listando todos os pedidos");
        return new ArrayList<>(pedidos.values());
    }

    public Optional<PedidoDto> buscarPorId(UUID id) {
        log.debug("Buscando pedido por id: {}", id);
        return Optional.ofNullable(pedidos.get(id));
    }

    public PedidoDto criar(List<String> itens, String cliente) {
        var pedido = PedidoDto.criar(itens, cliente);
        var valorTotal = calcularValor(itens);
        
        var pedidoComValor = new PedidoDto(
            pedido.id(),
            pedido.itens(),
            valorTotal,
            pedido.status(),
            pedido.cliente(),
            pedido.createdAt(),
            pedido.updatedAt()
        );
        
        pedidos.put(pedidoComValor.id(), pedidoComValor);
        log.info("Pedido criado: id={}, itens={}, valorTotal={}", pedido.id(), itens.size(), valorTotal);
        return pedidoComValor;
    }

    public Optional<PedidoDto> atualizarStatus(UUID id, String novoStatus) {
        return Optional.ofNullable(pedidos.get(id)).map(existente -> {
            var atualizado = new PedidoDto(
                existente.id(),
                existente.itens(),
                existente.valorTotal(),
                novoStatus,
                existente.cliente(),
                existente.createdAt(),
                java.time.Instant.now()
            );
            pedidos.put(id, atualizado);
            log.info("Pedido {} atualizado para status: {}", id, novoStatus);
            return atualizado;
        });
    }

    private BigDecimal calcularValor(List<String> itens) {
        // Preços simulados por item
        return itens.stream()
            .map(i -> new BigDecimal(String.valueOf(50.0 + Math.random() * 500)))
            .reduce(BigDecimal.ZERO, BigDecimal::add)
            .setScale(2, java.math.RoundingMode.HALF_UP);
    }

    private void seed() {
        criar(List.of("Notebook Dell XPS", "Mouse Gamer"), "João Silva");
        criar(List.of("Monitor 32\" 4K", "Teclado Mecânico", "Hub USB-C"), "Maria Santos");
        criar(List.of("iPhone 16 Pro", "Capa Protetora", "Carregador"), "Pedro Costa");
    }
}
