export default {
  site: {
    title: "El Cordón",
    author: "geroluna44",
    url: "https://geroluna44.github.io/blog/",
    lang: "es",
    description: "Bienvenido a mi blog personal. Escribo sobre videojuegos, arte, política, software, religión, música, filosofia... de todo un poco.",
  },
  analytics: {
    // Dominio de GoatCounter (ej. "blog.gero.goatcounter.com").
    // Vacío = analytics desactivado.
    goatcounter: "",
  },
  contact: {
    email: "geroluna44@proton.me",
    // Button Wall: imágenes en src/public/buttonwall/, cada una con su URL.
    // URL vacía = imagen sin enlace.
    buttonwall: [
      { file: "join-the-fediverse.gif", url: "https://es.wikipedia.org/wiki/Fediverso" },
      { file: "linux-p.gif", url: "https://distrowatch.com" },
      { file: "dont-be-a-phone-chump-get-a-computer.gif", url: "" },
    ],
  },
  comments: {
    // Configuración de Giscus. Deja vacío para desactivar.
    // Requiere un repo de GitHub con Discussions habilitado.
    giscus: {
      repo: "",
      repoId: "",
      category: "Announcements",
      categoryId: "",
      mapping: "pathname",
      strict: "0",
      reactionsEnabled: "1",
      emitMetadata: "0",
      inputPosition: "top",
      theme: "transparent_dark",
      lang: "es",
    },
  },
};
