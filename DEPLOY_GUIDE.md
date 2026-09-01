# 🚀 Guía de Despliegue en Render (Multijugador Online)

Esta guía te explica paso a paso cómo publicar tu juego **Laberinto 3D Multijugador** en **Render.com** para que puedas compartir tu enlace y jugar con amigos desde cualquier lugar y dispositivo.

---

## 📋 Requisitos Previos
1. Una cuenta gratuita en [GitHub](https://github.com/).
2. Una cuenta gratuita en [Render.com](https://render.com/).

---

## 🛠️ PASO 1: Subir tu Código a GitHub

Abre tu terminal en la carpeta del proyecto (`LaberintoCagao`) y ejecuta los siguientes comandos:

```bash
# 1. Inicializar repositorio git (si no lo has hecho)
git init

# 2. Agregar todos los archivos
git add .

# 3. Crear el primer commit
git commit -m "Laberinto 3D con Multijugador y Personaje Loco Joven"

# 4. Cambiar a rama principal
git branch -M main

# 5. Conectar con tu repositorio de GitHub (Reemplaza con tu URL de GitHub)
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git

# 6. Subir los archivos
git push -u origin main
```

---

## 🌐 PASO 2: Desplegar en Render.com (Gratis)

### Opción A: Despliegue Automático con `render.yaml` (Recomendado)
1. Inicia sesión en [Render.com](https://dashboard.render.com/).
2. Haz click en el botón **New +** (arriba a la derecha) y selecciona **Blueprint**.
3. Conecta tu repositorio de GitHub.
4. Render detectará automáticamente el archivo `render.yaml` preconfigurado con todos los comandos (`npm install && npm run build` y `npm start`).
5. Haz click en **Apply** y espera ~2 minutos a que termine de compilar.

---

### Opción B: Despliegue Manual como Web Service
Si prefieres crearlo manualmente:
1. En Render Dashboard, haz click en **New +** ➔ **Web Service**.
2. Conecta tu repositorio de GitHub.
3. Rellena los siguientes campos:
   - **Name**: `laberinto-3d-multijugador`
   - **Language / Environment**: `Node`
   - **Region**: `Oregon (US West)` o la más cercana
   - **Branch**: `main`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
4. Haz click en **Create Web Service**.

---

## 🎮 PASO 3: ¡A Jugar con Amigos!

1. Una vez completado el despliegue, Render te proporcionará una URL pública segura (ej: `https://laberinto-3d-multijugador.onrender.com`).
2. Entra al enlace desde tu navegador.
3. Haz click en **MULTIJUGADOR ONLINE** ➔ **CREAR SALA** ➔ Selecciona el modo de juego (1v1, 1v1v1, FFA, 2v2).
4. Pasa el **Código de Sala** (ej: `LAB-8391`) a tus amigos para que se unan desde sus navegadores (PC, Mac, laptop).
5. ¡Pulsa **INICIAR PARTIDA** y a disfrutar del laberinto!
