import express from "express";
import "dotenv/config";

const app = express();
const port = 3000;

app.use(express.json());

const alunos = [
  { id: 1, nome: "Augusto", turma: "2TIB" },
  { id: 2, nome: "Gustavo", turma: "2TIB" },
  { id: 3, nome: "Rayssa", turma: "2TIB" },
  { id: 4, nome: "Amanda", turma: "2TIB" },
  { id: 5, nome: "Marcos", turma: "2TIB" },
  { id: 6, nome: "Michelly", turma: "2TIB" },
  { id: 7, nome: "Maria Fernanda", turma: "2TIB" },
  { id: 8, nome: "Fellype", turma: "2TIB" }
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
    mensagem: "Servidor Express funcionando!",
    disciplina: "Desenvolvimento de Websites",
    bimestre: "3º bimestre"
  });
});

app.get("/alunos", autenticar, (req, res) => {
  res.json(alunos);
});

app.get("/alunos/:id", (req, res) => {
  const id = Number(req.params.id);

  const aluno = alunos.find((aluno) => aluno.id === id);

  if (!aluno) {
    return res.status(404).json({
      message: "Aluno não encontrado"
    });
  }

  res.json(aluno);
});

app.post("/alunos", autenticar, (req, res) => {
  const novoAluno = {
    id: alunos.length + 1,
    nome: req.body.nome,
    turma: req.body.turma
  };

  alunos.push(novoAluno);

  res.status(201).json({
    mensagem: "Aluno cadastrado com sucesso",
    aluno: novoAluno
  });
});

app.patch("/alunos/:id", autenticar, (req, res) => {
  const id = Number(req.params.id);
  const { nome, turma } = req.body;

  const aluno = alunos.find((aluno) => aluno.id === id);

  if (!aluno) {
    return res.status(404).json({
      message: "Aluno não encontrado"
    });
  }

  if (nome) {
    aluno.nome = nome;
  }

  if (turma) {
    aluno.turma = turma;
  }

  res.json(aluno);
});

app.delete("/alunos/:id", autenticar, (req, res) => {
  const id = Number(req.params.id);

  const alunoIndex = alunos.findIndex((aluno) => aluno.id === id);

  if (alunoIndex === -1) {
    return res.status(404).json({
      message: "Aluno não encontrado"
    });
  }

  alunos.splice(alunoIndex, 1);

  res.json({
    message: "Aluno removido com sucesso"
  });
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
