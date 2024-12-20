const express = require("express");
const crypto = require("node:crypto");
const movies = require("./movies.json");
const cors = require("cors");
const path = require("node:path");
const { validateMovie, validatePartialMovie } = require("./schemas/movies");
const app = express();

app.disable("x-powered-by");
app.use(express.json());

// Sirve contenido estático
app.use(express.static(path.join(__dirname, "web"), { extensions: ["html"] }));

// Configuración de CORS
app.use(
  cors({
    origin: (origin, callback) => {
      const ACCEPTED_ORIGINS = [
        "http://localhost:57031",
        "http://localhost:1234",
        "https://api-rest-test.vercel.app",
        "https://movies.com",
      ];
      if (ACCEPTED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      if (!origin) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS."));
    },
  })
);

// Ruta para servir el HTML principal
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "web", "index.html"));
});

// API endpoints
app.get("/api/movies", (req, res) => {
  const { genre } = req.query;

  if (genre) {
    const filteredMovies = movies.filter((movie) =>
      movie.genre.some((g) => g.toLowerCase() === genre.toLowerCase())
    );
    return res.json(filteredMovies);
  }
  res.json(movies);
});

app.get("/api/movies/:id", (req, res) => {
  const { id } = req.params;
  const movie = movies.find((movie) => movie.id === id);
  if (movie) return res.json(movie);
  res.status(404).json({ message: "Movie not found" });
});

app.post("/api/movies", (req, res) => {
  const result = validateMovie(req.body);

  if (result.error) {
    return res.status(400).json({ message: JSON.parse(result.error.message) });
  }
  const newMovie = {
    id: crypto.randomUUID(),
    ...result.data,
  };
  movies.push(newMovie);
  res.status(201).json(newMovie);
});

app.delete("/api/movies/:id", (req, res) => {
  const { id } = req.params;

  const movieIndex = movies.findIndex((movie) => movie.id === id);

  if (movieIndex === -1) {
    return res.status(404).json({ message: "Movie not found" });
  }

  movies.splice(movieIndex, 1);
  return res.json({ message: "Movie deleted" });
});

app.patch("/api/movies/:id", (req, res) => {
  const { id } = req.params;
  const result = validatePartialMovie(req.body);

  if (result.error) {
    return res.status(400).json({ message: JSON.parse(result.error.message) });
  }

  const movieIndex = movies.findIndex((movie) => movie.id === id);
  if (movieIndex === -1)
    return res.status(404).json({ message: "Movie not found" });

  const updatedMovie = {
    ...movies[movieIndex],
    ...result.data,
  };
  movies[movieIndex] = updatedMovie;
  return res.json(updatedMovie);
});

// Escuchar en el puerto
const PORT = process.env.PORT ?? 1234;
app.listen(PORT, () => {
  console.log(`Server listening on port http://localhost:${PORT}`);
});
