package com.dorigao.pedido;

import com.dorigao.pedido.service.PedidoService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class PedidoApplicationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private PedidoService service;

    @Test
    void healthEndpointShouldReturnUp() throws Exception {
        mockMvc.perform(get("/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    void readinessEndpointShouldReturnUp() throws Exception {
        mockMvc.perform(get("/health/readiness"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    void shouldListAllPedidoDtos() throws Exception {
        mockMvc.perform(get("/api/pedido"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThan(0))))
                .andExpect(jsonPath("$[0].id", notNullValue()))
                .andExpect(jsonPath("$[0].itens", notNullValue()))
                .andExpect(jsonPath("$[0].cliente", notNullValue()))
                .andExpect(jsonPath("$[0].valorTotal", notNullValue()));
    }

    @Test
    void shouldCreatePedidoDto() throws Exception {
        String json = """
            {
                "itens": ["Teclado Mecânico", "Mouse Gamer"],
                "cliente": "João Silva"
            }
            """;

        mockMvc.perform(post("/api/pedido")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.itens", hasSize(2)))
                .andExpect(jsonPath("$.cliente").value("João Silva"))
                .andExpect(jsonPath("$.id", notNullValue()));
    }

    @Test
    void shouldReturn404ForInvalidId() throws Exception {
        mockMvc.perform(get("/api/pedido/00000000-0000-0000-0000-000000000000"))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldReturnMetrics() throws Exception {
        mockMvc.perform(get("/metrics"))
                .andExpect(status().isOk());
    }
}
