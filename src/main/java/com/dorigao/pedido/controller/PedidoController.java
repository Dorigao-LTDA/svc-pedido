package com.dorigao.pedido.controller;

import com.dorigao.pedido.model.PedidoDto;
import com.dorigao.pedido.service.PedidoService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/pedido")
public class PedidoController {

    private static final Logger log = LoggerFactory.getLogger(PedidoController.class);
    private final PedidoService service;

    public PedidoController(PedidoService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<PedidoDto>> listar() {
        log.info("GET /api/pedido");
        return ResponseEntity.ok(service.listarTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PedidoDto> buscarPorId(@PathVariable UUID id) {
        log.info("GET /api/pedido/{}", id);
        return service.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<PedidoDto> criar(@Valid @RequestBody CriarPedidoRequest request) {
        log.info("POST /api/pedido - itens={}, cliente={}", request.itens().size(), request.cliente());
        var pedido = service.criar(request.itens(), request.cliente());
        return ResponseEntity.status(HttpStatus.CREATED).body(pedido);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<PedidoDto> atualizarStatus(@PathVariable UUID id, @RequestParam String status) {
        log.info("PATCH /api/pedido/{}/status - {}", id, status);
        return service.atualizarStatus(id, status)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    public record CriarPedidoRequest(
        @NotEmpty List<String> itens,
        @NotBlank String cliente
    ) {}
}
