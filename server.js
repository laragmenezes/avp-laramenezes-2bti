import express from "express";
import "dotenv/config";
import bcrypt from "bcrypt";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import multer from "multer";
import swaggerUi from "swagger-ui-express";

const app = express();
const port = 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pastaUploads = path.join(__dirname, "uploads");
fs.mkdirSync(pastaUploads, { recursive: true });

app.use(express.json());

const usuarios = [];
const tokens = new Set();
const carros = [
  { id: 1, marca: "Toyota", modelo: "Corolla", ano: 2024 },
  { id: 2, marca: "Volkswagen", modelo: "T-Cross", ano: 2023 },
  { id: 3, marca: "Honda", modelo: "Civic", ano: 2022 },
  { id: 4, marca: "Chevrolet", modelo: "Onix", ano: 2024 },
  { id: 5, marca: "Fiat", modelo: "Fastback", ano: 2023 }
];

function autenticar(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token || (!tokens.has(token) && token !== process.env.TOKEN_SECRETO)) {
    return res.status(401).json({
      erro: "Acesso não autorizado. Token ausente ou inválido"
    });
  }

  next();
}

const upload = multer({
  dest: pastaUploads,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    if (!file.mimetype.startsWith("image/")) {
      return callback(new Error("Apenas arquivos de imagem são permitidos"));
    }

    callback(null, true);
  }
});

app.post("/usuarios", async (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: "Nome, email e senha são obrigatórios" });
  }

  if (usuarios.some((usuario) => usuario.email === email)) {
    return res.status(409).json({ erro: "Email já cadastrado" });
  }

  const senhaHash = await bcrypt.hash(senha, 10);
  const usuario = { id: usuarios.length + 1, nome, email, senha: senhaHash };
  usuarios.push(usuario);

  res.status(201).json({
    mensagem: "Usuário cadastrado com sucesso",
    usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email }
  });
});

app.post("/login", async (req, res) => {
  const { email, senha } = req.body;
  const usuario = usuarios.find((item) => item.email === email);

  if (!usuario || !(await bcrypt.compare(senha || "", usuario.senha))) {
    return res.status(401).json({ erro: "Email ou senha inválidos" });
  }

  const token = crypto.randomBytes(32).toString("hex");
  tokens.add(token);
  res.json({ mensagem: "Login realizado com sucesso", token });
});

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

app.get("/carros/:id", autenticar, (req, res) => {
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

function atualizarCarro(req, res) {
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
}

app.patch("/carros/:id", autenticar, atualizarCarro);
app.put("/carros/:id", autenticar, atualizarCarro);

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

app.post("/upload", autenticar, (req, res) => {
  upload.single("imagem")(req, res, (erro) => {
    if (erro instanceof multer.MulterError && erro.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ erro: "A imagem deve ter no máximo 5 MB" });
    }

    if (erro) {
      return res.status(400).json({ erro: erro.message });
    }

    if (!req.file) {
      return res.status(400).json({ erro: "Envie uma imagem no campo imagem" });
    }

    res.status(201).json({
      mensagem: "Imagem enviada com sucesso",
      arquivo: req.file.filename,
      tamanho: req.file.size,
      tipo: req.file.mimetype
    });
  });
});

const swaggerDocument = {
  openapi: "3.0.0",
  info: { title: "API de Carros", version: "1.0.0", description: "API da AV2" },
  servers: [{ url: `http://localhost:${port}` }],
  components: {
    securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } }
  },
  paths: {
    "/usuarios": { post: { summary: "Cadastra um usuário" } },
    "/login": { post: { summary: "Realiza login e retorna um token" } },
    "/carros": {
      get: { summary: "Lista carros", security: [{ bearerAuth: [] }] },
      post: { summary: "Cadastra um carro", security: [{ bearerAuth: [] }] }
    },
    "/carros/{id}": {
      get: { summary: "Consulta um carro", security: [{ bearerAuth: [] }] },
      put: { summary: "Edita um carro", security: [{ bearerAuth: [] }] },
      delete: { summary: "Exclui um carro", security: [{ bearerAuth: [] }] }
    },
    "/upload": {
      post: { summary: "Envia uma imagem de até 5 MB", security: [{ bearerAuth: [] }] }
    }
  }
};

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
