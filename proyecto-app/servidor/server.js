const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const path = require("path");
const multer = require("multer"); 

const app = express();

app.use(express.static(path.join(__dirname, "public")));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve uploaded files
app.use(cors());
app.use(express.json());

const port = Number(process.env.PORT) || 5000;
const dbHost = process.env.MYSQL_ADDON_HOST || process.env.DB_HOST || "localhost";
const dbUser = process.env.MYSQL_ADDON_USER || process.env.DB_USER || "modacom";
const dbPassword = process.env.MYSQL_ADDON_PASSWORD || process.env.DB_PASSWORD || "root";
const dbName = process.env.MYSQL_ADDON_DB || process.env.DB_NAME || "modacom";
const dbPort = Number(process.env.MYSQL_ADDON_PORT || process.env.DB_PORT || 3306);

const db = mysql.createPool({
    host: dbHost,
    user: dbUser,
    password: dbPassword,
    database: dbName,
    port: dbPort,
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0,
});

db.on("connection", (connection) => {
    connection.on("error", (err) => {
        console.error("Database connection error:", err.code || err.message);
    });
});

db.query("SELECT 1", (err) => {
    if (err) {
        console.error("Error connecting to the database:", err);
        process.exit(1); // Salir del proceso si no se puede conectar
    }
    console.log("Connected to the database.");
});


app.post("/Registrarse", (req, res) => {
    const { Name, LastName, Email, password, Age, Telf } = req.body;
    if (!Name || !LastName || !Email || !password || !Age || !Telf) {
        return res.status(400).json({ message: "Todos los campos son requeridos" });
    }

    const query = "INSERT INTO Usuario(Name, LastName, Email, password, Age, Telf) VALUES(?, ?, ?, MD5(?), ?, ?);";
    const values = [Name, LastName, Email, password, Age, Telf];

    db.query(query, values, (err) => {
        if (err) {
            console.error("Error inserting data:", err);
            return res.status(500).json({ message: "Error inserting data: " + err.message });
        }
        return res.status(200).json({ success: "Student added successfully" });
    });
});

app.post("/Login", (req, res) => {
    const { Email, password } = req.body;

    if (!Email || !password) {
        return res.status(400).json({ message: "Correo electrónico y contraseña son requeridos" });
    }

    const query = "SELECT * FROM Usuario WHERE Email = ? AND password = MD5(?);";
    const values = [Email, password];

    db.query(query, values, (err, results) => {
        if (err) {
            console.error("Error querying data:", err);
            return res.status(500).json({ message: "Error querying data: " + err.message });
        }

        if (results.length === 0) {
            return res.status(401).json({ message: "Credenciales incorrectas" });
        }

        res.json({ success: true, message: "Inicio de sesión exitoso" });
    });
});

// Agregar la ruta para recuperar la contraseña
app.post("/Actualizar", (req, res) => {
    const { Email, newPassword } = req.body;

    if (!Email || !newPassword) {
        return res.status(400).json({ message: "Correo electrónico y nueva contraseña son requeridos" });
    }

    // Consulta para verificar si el usuario existe
    const checkUserQuery = "SELECT * FROM Usuario WHERE Email = ?";
    db.query(checkUserQuery, [Email], (err, results) => {
        if (err) {
            console.error("Error querying data:", err);
            return res.status(500).json({ message: "Error querying data: " + err.message });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        // Si el usuario existe, actualiza la contraseña
        const updatePasswordQuery = "UPDATE Usuario SET password = MD5(?) WHERE Email = ?";
        db.query(updatePasswordQuery, [newPassword, Email], (err) => {
            if (err) {
                console.error("Error updating password:", err);
                return res.status(500).json({ message: "Error updating password: " + err.message });
            }

            res.json({ success: true, message: "Contraseña actualizada exitosamente" });
        });
    });
});

// Middleware para carga de archivos
const upload = multer({ storage: multer.memoryStorage() });


// CRUD Operaciones para Promos

// Ver Productos
app.get("/api/products", (req, res) => {
    const query = "SELECT * FROM Promos";
    db.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching products:", err);
            return res.status(500).json({ message: "Error fetching products: " + err.message });
        }
        res.json(results);
    });
});


// Crear nuevo producto
app.post("/api/products", upload.single("imgProducto"), (req, res) => {
    const { PrecioAnt, PrecioPromo } = req.body;
    const imgProducto = req.file ? req.file.buffer : null;

    if (!PrecioAnt || !PrecioPromo) {
        return res.status(400).json({ message: "PrecioAnt and PrecioPromo are required" });
    }

    const query = "INSERT INTO Promos (PrecioAnt, PrecioPromo, imgProducto) VALUES (?, ?, ?)";
    const values = [PrecioAnt, PrecioPromo, imgProducto];

    db.query(query, values, (err) => {
        if (err) {
            console.error("Error inserting product:", err);
            return res.status(500).json({ message: "Error inserting product: " + err.message });
        }
        res.status(201).json({ success: true, message: "Product created successfully" });
    });
});


// Actualizar Producto
app.put("/api/products/:ID", upload.single("imgProducto"), (req, res) => {
    const { ID } = req.params;
    const { PrecioAnt, PrecioPromo } = req.body;
    const imgProducto = req.file ? req.file.buffer : null;

    if (!PrecioAnt || !PrecioPromo) {
        return res.status(400).json({ message: "PrecioAnt and PrecioPromo are required" });
    }

    const query = "UPDATE Promos SET PrecioAnt = ?, PrecioPromo = ?, imgProducto = ? WHERE ID = ?";
    const values = [PrecioAnt, PrecioPromo, imgProducto, ID];

    db.query(query, values, (err) => {
        if (err) {
            console.error("Error updating product:", err);
            return res.status(500).json({ message: "Error updating product: " + err.message });
        }
        res.json({ success: true, message: "Product updated successfully" });
    });
});


// Borrar Producto
app.delete("/api/products/:ID", (req, res) => {
    const { ID } = req.params;
    const query = "DELETE FROM Promos WHERE ID = ?";

    db.query(query, [ID], (err) => {
        if (err) {
            console.error("Error deleting product:", err);
            return res.status(500).json({ message: "Error deleting product: " + err.message });
        }
        res.json({ success: true, message: "Product deleted successfully" });
    });
});


// Imagen
app.get("/api/products/:ID/image", (req, res) => {
    const { ID } = req.params;
    const query = "SELECT imgProducto FROM Promos WHERE ID = ?";

    db.query(query, [ID], (err, results) => {
        if (err) {
            console.error("Error fetching image:", err);
            return res.status(500).json({ message: "Error fetching image: " + err.message });
        }
        const image = results[0]?.imgProducto;
        if (image) {
            res.writeHead(200, {'Content-Type': 'image/jpeg'}); // Adjust content type as needed
            res.end(image);
        } else {
            res.status(404).json({ message: "Image not found" });
        }
    });
});

app.listen(port, "0.0.0.0", () => {
    console.log(`Listening on port ${port}`);
});
