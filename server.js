import express from "express";
import "dotenv/config";

const app = express();
const port = 3000;

app.use(express.json());

const carros = [
  { id: 1, marca: "Toyota", modelo: "Corolla", ano: 2024 },
  { id: 2, marca: "Volkswagen", modelo: "T-Cross", ano: 2023 },
  { id: 3, marca: "Honda", modelo: "Civic", ano: 2022 },
  { id: 4, marca: "Chevrolet", modelo: "Onix", ano: 2024 },
  { id: 5, marca: "Fiat", modelo: "Fastback", ano: 2023 }
];

function autenticar(req, res, next) {
  const authHeader = req.headers.authorization;
  const tokenSecreto = process.env.TOKEN_SECRETO;

  if (authHeader !== `Bearer ${tokenSecreto}`) {
    return res.status(401).json({
      erro: "Acesso não autorizado. Token ausente ou inválido"
    });
  }

  next();
}

app.get("/", (req, res) => {
  res.json({
    mensagem: "API de carros funcionando!",
    disciplina: "Desenvolvimento de Websites",
    bimestre: "3º bimestre"
  });
});

app.get("/carros", autenticar, (req, res) => {
  res.json(carros);
});

app.get("/carros/:id", (req, res) => {
  const id = Number(req.params.id);

  const carro = carros.find((carro) => carro.id === id);

  if (!carro) {
    return res.status(404).json({
      message: "Carro não encontrado"
    });
  }

  res.json(carro);
});

app.post("/carros", autenticar, (req, res) => {
  const novoCarro = {
    id: carros.length + 1,
    marca: req.body.marca,
    modelo: req.body.modelo,
    ano: req.body.ano
  };

  carros.push(novoCarro);

  res.status(201).json({
    mensagem: "Carro cadastrado com sucesso",
    carro: novoCarro
  });
});

app.patch("/carros/:id", autenticar, (req, res) => {
  const id = Number(req.params.id);
  const { marca, modelo, ano } = req.body;

  const carro = carros.find((carro) => carro.id === id);

  if (!carro) {
    return res.status(404).json({
      message: "Carro não encontrado"
    });
  }

  if (marca) {
    carro.marca = marca;
  }

  if (modelo) {
    carro.modelo = modelo;
  }

  if (ano) {
    carro.ano = ano;
  }

  res.json(carro);
});

app.delete("/carros/:id", autenticar, (req, res) => {
  const id = Number(req.params.id);

  const carroIndex = carros.findIndex((carro) => carro.id === id);

  if (carroIndex === -1) {
    return res.status(404).json({
      message: "Carro não encontrado"
    });
  }

  carros.splice(carroIndex, 1);

  res.json({
    message: "Carro removido com sucesso"
  });
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
