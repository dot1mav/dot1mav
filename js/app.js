// MAV Portfolio - Vue.js Application
const { createApp } = Vue;

createApp({
  data() {
    return {
      // Loading State
      isLoading: true,

      // Dark Mode
      isDarkMode: false,

      // Windows State
      windows: {
        projects: {
          open: false,
          minimized: false,
          maximized: false,
          title: "Projects",
          x: 100,
          y: 100,
          width: 800,
        },
        experiences: {
          open: false,
          minimized: false,
          maximized: false,
          title: "Experiences",
          x: 120,
          y: 120,
          width: 700,
        },
        skills: {
          open: false,
          minimized: false,
          maximized: false,
          title: "Skills",
          x: 140,
          y: 140,
          width: 500,
        },
        certifications: {
          open: false,
          minimized: false,
          maximized: false,
          title: "Certifications",
          x: 160,
          y: 160,
          width: 500,
        },
        contact: {
          open: false,
          minimized: false,
          maximized: false,
          title: "Contact",
          x: 180,
          y: 180,
          width: 400,
        },
        about: {
          open: false,
          minimized: false,
          maximized: false,
          title: "About Me",
          x: 200,
          y: 200,
          width: 450,
        },
      },

      // Drag State
      dragState: {
        isDragging: false,
        windowId: null,
        startX: 0,
        startY: 0,
      },

      // Current Time for Taskbar
      currentTime: "",

      // Data from JSON
      projects: [],
      experiences: [],
      skills: {},
      certifications: [],
      aboutText1: "",
      aboutText2: "",
      aboutText3: "",
    };
  },

  computed: {
    // Get open windows for taskbar
    openTaskbarWindows() {
      const result = {};
      for (const [id, window] of Object.entries(this.windows)) {
        if (window.open) {
          result[id] = window;
        }
      }
      return result;
    },
  },

  methods: {
    // Window Management
    openWindow(id) {
      this.windows[id].open = true;
      this.windows[id].minimized = false;
    },

    closeWindow(id) {
      this.windows[id].open = false;
      this.windows[id].minimized = false;
      this.windows[id].maximized = false;
    },

    minimizeWindow(id) {
      this.windows[id].minimized = true;
    },

    restoreWindow(id) {
      this.windows[id].minimized = false;
    },

    maximizeWindow(id) {
      const win = this.windows[id];
      win.maximized = !win.maximized;
      if (win.maximized) {
        win.prevX = win.x;
        win.prevY = win.y;
        win.prevWidth = win.width;
        win.x = 0;
        win.y = 0;
        win.width = window.innerWidth;
      } else {
        win.x = win.prevX || 100;
        win.y = win.prevY || 100;
        win.width = win.prevWidth || 500;
      }
    },

    // Update Clock
    updateClock() {
      const now = new Date();
      this.currentTime = now.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      });
    },

    // Dark Mode
    toggleDarkMode() {
      this.isDarkMode = !this.isDarkMode;
      document.body.classList.toggle("dark-mode");

      // Save preference to localStorage
      localStorage.setItem("darkMode", this.isDarkMode);
    },

    // Drag and Drop
    startDrag(e, id) {
      // Don't drag if clicking on controls
      if (e.target.closest(".title-bar-controls")) return;

      e.preventDefault();

      this.dragState = {
        isDragging: true,
        windowId: id,
        startX: e.clientX - this.windows[id].x,
        startY: e.clientY - this.windows[id].y,
      };

      // Add event listeners
      document.addEventListener("mousemove", this.handleDrag);
      document.addEventListener("mouseup", this.stopDrag);
    },

    handleDrag(e) {
      if (this.dragState.isDragging && this.dragState.windowId) {
        const id = this.dragState.windowId;

        // Calculate new position
        let newX = e.clientX - this.dragState.startX;
        let newY = e.clientY - this.dragState.startY;

        // Keep window within viewport
        const maxX = window.innerWidth - 100;
        const maxY = window.innerHeight - 100;

        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));

        // Update position
        this.windows[id].x = newX;
        this.windows[id].y = newY;
      }
    },

    stopDrag() {
      this.dragState.isDragging = false;
      this.dragState.windowId = null;

      // Remove event listeners
      document.removeEventListener("mousemove", this.handleDrag);
      document.removeEventListener("mouseup", this.stopDrag);
    },

    // Load Data from JSON
    async loadData() {
      try {
        const response = await fetch("data.json");
        const data = await response.json();
        this.projects = data.projects;
        this.experiences = data.experiences;
        this.skills = data.skills;
        this.certifications = data.certifications;
        this.aboutText1 = data.aboutText1;
        this.aboutText2 = data.aboutText2;
        this.aboutText3 = data.aboutText3;
      } catch (error) {
        console.error("Error loading data:", error);
        // Fallback data if fetch fails
        this.projects = [];
        this.experiences = [];
        this.skills = {};
        this.certifications = [];
        this.aboutText1 = "Fallback about text.";
      } finally {
        this.isLoading = false;
      }
    },

    // Format Key for Skills
    formatKey(key) {
      return (
        key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1")
      );
    },

    // Initialize App
    initializeApp() {
      // Load dark mode preference
      const savedDarkMode = localStorage.getItem("darkMode");
      if (savedDarkMode === "true") {
        this.isDarkMode = true;
        document.body.classList.add("dark-mode");
      }

      // Adjust window positions for smaller screens
      if (window.innerWidth < 768) {
        Object.keys(this.windows).forEach((id, index) => {
          this.windows[id].x = 20;
          this.windows[id].y = 50 + index * 30;
          this.windows[id].width = Math.min(
            this.windows[id].width,
            window.innerWidth - 40
          );
        });
      }

      // Update clock every minute
      this.updateClock();
      setInterval(this.updateClock, 60000);
    },
  },

  async mounted() {
    // Load data first
    await this.loadData();

    // Initialize app
    this.initializeApp();

    // Handle window resize
    window.addEventListener("resize", () => {
      // Adjust window positions if they're off screen
      Object.keys(this.windows).forEach((id) => {
        if (this.windows[id].open && !this.windows[id].maximized) {
          const maxX = window.innerWidth - 100;
          const maxY = window.innerHeight - 100;

          if (this.windows[id].x > maxX) {
            this.windows[id].x = Math.max(0, maxX);
          }
          if (this.windows[id].y > maxY) {
            this.windows[id].y = Math.max(0, maxY);
          }
        }
      });
    });

    console.log("MAV Portfolio loaded successfully! 🎉");
    console.log("Enjoy the Windows 98 nostalgia! 💾");
  },
}).mount("#app");
