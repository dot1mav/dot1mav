// MAV Portfolio - Vue.js Application
const { createApp } = Vue;

createApp({
  data() {
    return {
      isLoading: true,
      isDarkMode: false,
      windows: {
        projects: {
          open: false,
          minimized: false,
          maximized: false,
          title: "Projects",
          x: 100,
          y: 100,
          width: 800,
          height: 480,
        },
        experiences: {
          open: false,
          minimized: false,
          maximized: false,
          title: "Experiences",
          x: 120,
          y: 120,
          width: 700,
          height: 420,
        },
        skills: {
          open: false,
          minimized: false,
          maximized: false,
          title: "Skills",
          x: 140,
          y: 140,
          width: 600,
          height: 460,
        },
        certifications: {
          open: false,
          minimized: false,
          maximized: false,
          title: "Certifications",
          x: 160,
          y: 160,
          width: 700,
          height: 460,
        },
        contact: {
          open: false,
          minimized: false,
          maximized: false,
          title: "Contact",
          x: 180,
          y: 180,
          width: 400,
          height: 300,
        },
        about: {
          open: false,
          minimized: false,
          maximized: false,
          title: "About Me",
          x: 200,
          y: 200,
          width: 550,
          height: 520,
        },
      },

      dragState: {
        isDragging: false,
        windowId: null,
        startX: 0,
        startY: 0,
      },

      currentTime: "",

      projects: [],
      experiences: [],
      skills: {},
      certifications: [],
      aboutText1: "",
      aboutText2: "",
      aboutText3: "",
      isMobile: false,
      projectsSearch: "",
      projectsTechFilter: "",
      projectsSort: "date_desc",
      groupByYear: true,

      expandedProjects: [],
    };
  },

  computed: {
    openTaskbarWindows() {
      const result = {};
      for (const [id, window] of Object.entries(this.windows)) {
        if (window.open) {
          result[id] = window;
        }
      }
      return result;
    },
    allProjectTags() {
      const tags = new Set();
      (this.projects || []).forEach((p) => {
        const parts = this.splitTech(p.tech_stack);
        parts.forEach((t) => tags.add(t));
      });
      return Array.from(tags).sort();
    },

    filteredAndSortedProjects() {
      let list = (this.projects || []).slice();

      if (this.projectsTechFilter) {
        list = list.filter((p) =>
          this.splitTech(p.tech_stack).includes(this.projectsTechFilter)
        );
      }

      const q = (this.projectsSearch || "").trim().toLowerCase();
      if (q) {
        list = list.filter((p) => {
          return (
            (p.title && p.title.toLowerCase().includes(q)) ||
            (p.description_short &&
              p.description_short.toLowerCase().includes(q)) ||
            (p.description_full &&
              p.description_full.toLowerCase().includes(q)) ||
            (p.tech_stack && p.tech_stack.toLowerCase().includes(q))
          );
        });
      }

      const parseDate = (d) => {
        if (!d) return null;
        const iso = Date.parse(d);
        if (!isNaN(iso)) return new Date(iso);
        const m = d.match(/(19|20)\d{2}/);
        if (m) return new Date(parseInt(m[0], 10), 0, 1);
        return null;
      };

      list.forEach((p) => {
        p._parsedDate = parseDate(p.date || p.dates || null);
      });

      switch (this.projectsSort) {
        case "title_asc":
          list.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
          break;
        case "title_desc":
          list.sort((a, b) => (b.title || "").localeCompare(a.title || ""));
          break;
        case "date_asc":
          list.sort((a, b) => {
            const A = a._parsedDate ? a._parsedDate.getTime() : -Infinity;
            const B = b._parsedDate ? b._parsedDate.getTime() : -Infinity;
            return A - B;
          });
          break;
        case "date_desc":
        default:
          list.sort((a, b) => {
            const A = a._parsedDate ? a._parsedDate.getTime() : -Infinity;
            const B = b._parsedDate ? b._parsedDate.getTime() : -Infinity;
            return B - A;
          });
          break;
      }

      return list;
    },

    groupedProjects() {
      const groups = {};

      for (const p of this.filteredAndSortedProjects) {
        let year = "Undated";
        if (p._parsedDate instanceof Date && !isNaN(p._parsedDate)) {
          year = String(p._parsedDate.getFullYear());
        } else {
          const candidate = (p.date || p.dates || "").toString();
          const m = candidate.match(/(19|20)\d{2}/);
          if (m) year = m[0];
        }

        if (!groups[year]) groups[year] = [];
        groups[year].push(p);
      }

      const entries = Object.entries(groups).map(([year, projects]) => ({
        year,
        projects,
      }));

      entries.sort((a, b) => {
        if (a.year === "Undated") return 1;
        if (b.year === "Undated") return -1;
        return Number(b.year) - Number(a.year);
      });

      return entries;
    },
  },

  methods: {
    sendUmamiEvent(name, data = {}) {
      try {
        if (!name) return;
        const eventName = String(name).slice(0, 50);
        console.log(
          typeof window !== "undefined" && typeof window.umami !== "undefined"
        );
        console.log(window.umami);
        if (
          typeof window !== "undefined" &&
          typeof window.umami !== "undefined"
        ) {
          if (data && Object.keys(data).length > 0) {
            window.umami.track(eventName, data);
          } else {
            window.umami.track(eventName);
          }
        } else {
        }
      } catch (err) {}
    },

    openWindow(id) {
      this.windows[id].open = true;
      this.windows[id].minimized = false;

      this.sendUmamiEvent("window_open", {
        window_id: id,
        window_title: this.windows[id].title,
      });
    },

    closeWindow(id) {
      this.windows[id].open = false;
      this.windows[id].minimized = false;
      this.windows[id].maximized = false;

      this.sendUmamiEvent("window_close", {
        window_id: id,
        window_title: this.windows[id].title,
      });
    },

    minimizeWindow(id) {
      this.windows[id].minimized = true;

      this.sendUmamiEvent("window_minimize", {
        window_id: id,
        window_title: this.windows[id].title,
      });
    },

    restoreWindow(id) {
      this.windows[id].minimized = false;

      this.sendUmamiEvent("window_restore", {
        window_id: id,
        window_title: this.windows[id].title,
      });
    },

    maximizeWindow(id) {
      const win = this.windows[id];
      win.maximized = !win.maximized;
      if (win.maximized) {
        win.prevX = win.x;
        win.prevY = win.y;
        win.prevWidth = win.width;
        win.prevHeight = win.height;

        win.x = 0;
        win.y = 0;
        win.width = window.innerWidth;
        win.height = Math.max(window.innerHeight - 28, 200);
      } else {
        win.x = win.prevX !== undefined ? win.prevX : 100;
        win.y = win.prevY !== undefined ? win.prevY : 100;
        win.width = win.prevWidth !== undefined ? win.prevWidth : 500;
        win.height = win.prevHeight !== undefined ? win.prevHeight : 400;
      }

      this.sendUmamiEvent("window_maximize_toggle", {
        window_id: id,
        window_title: win.title,
        maximized: win.maximized,
      });
    },

    updateClock() {
      const now = new Date();
      this.currentTime = now.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      });
    },

    toggleDarkMode() {
      this.isDarkMode = !this.isDarkMode;
      document.body.classList.toggle("dark-mode");
      localStorage.setItem("darkMode", this.isDarkMode);

      this.sendUmamiEvent("dark_mode_toggle", {
        enabled: this.isDarkMode,
      });
    },

    startDrag(e, id) {
      if (e.target.closest(".title-bar-controls")) return;

      e.preventDefault();

      this.dragState = {
        isDragging: true,
        windowId: id,
        startX: e.clientX - this.windows[id].x,
        startY: e.clientY - this.windows[id].y,
      };

      document.addEventListener("mousemove", this.handleDrag);
      document.addEventListener("mouseup", this.stopDrag);
    },

    handleDrag(e) {
      if (this.dragState.isDragging && this.dragState.windowId) {
        const id = this.dragState.windowId;

        let newX = e.clientX - this.dragState.startX;
        let newY = e.clientY - this.dragState.startY;

        const maxX = window.innerWidth - 100;
        const maxY = window.innerHeight - 100;

        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));

        this.windows[id].x = newX;
        this.windows[id].y = newY;
      }
    },

    stopDrag() {
      this.dragState.isDragging = false;
      this.dragState.windowId = null;

      document.removeEventListener("mousemove", this.handleDrag);
      document.removeEventListener("mouseup", this.stopDrag);
    },

    updateIsMobile() {
      this.isMobile = window.innerWidth <= 480;
    },

    splitTech(techString) {
      if (!techString) return [];
      return techString
        .split(/\s*[,\/\|\;]\s*/)
        .map((s) => s.trim())
        .filter(Boolean);
    },

    splitSkills(skillsString) {
      if (!skillsString) return [];
      return skillsString
        .split(/\s*[,]\s*/)
        .map((s) => s.trim())
        .filter(Boolean);
    },

    truncate(text, limit = 160) {
      if (!text) return "";
      if (text.length <= limit) return text;
      return text.slice(0, limit).trim() + "…";
    },

    isExpanded(project) {
      return this.expandedProjects.includes(project.title);
    },

    toggleExpand(project) {
      const key = project.title;
      const idx = this.expandedProjects.indexOf(key);
      if (idx === -1) this.expandedProjects.push(key);
      else this.expandedProjects.splice(idx, 1);
    },

    formatDateShort(raw) {
      if (!raw) return "";
      const iso = Date.parse(raw);
      if (!isNaN(iso)) {
        const d = new Date(iso);
        const month = d.toLocaleString("en-US", { month: "short" });
        return `${month} ${d.getFullYear()}`;
      }
      const m = (raw + "").match(/(19|20)\d{2}/);
      return m ? m[0] : raw;
    },

    downloadResume() {
      const resumeUrl = "resume.pdf";

      const link = document.createElement("a");
      link.href = resumeUrl;
      link.download = "Mohammad_Amin_Vakili_Resume.pdf";
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      this.sendUmamiEvent("resume_download", {
        file_name: "Mohammad_Amin_Vakili_Resume.pdf",
      });
    },

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
        this.projects = [];
        this.experiences = [];
        this.skills = {};
        this.certifications = [];
        this.aboutText1 = "Fallback about text.";
      } finally {
        this.isLoading = false;
      }
    },

    formatKey(key) {
      return (
        key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1")
      );
    },

    initializeApp() {
      const savedDarkMode = localStorage.getItem("darkMode");
      if (savedDarkMode === "true") {
        this.isDarkMode = true;
        document.body.classList.add("dark-mode");
      }

      if (window.innerWidth < 768) {
        Object.keys(this.windows).forEach((id, index) => {
          this.windows[id].x = 20;
          this.windows[id].y = 50 + index * 40;
          this.windows[id].width = Math.min(
            this.windows[id].width,
            window.innerWidth - 40
          );
          this.windows[id].height = Math.min(
            this.windows[id].height,
            window.innerHeight - 100
          );
        });
      }

      this.updateClock();
      setInterval(this.updateClock, 60000);
    },

    _sourceGuardsConfig() {
      return {
        enableSourceGuards: true,
        githubUrl: "https://github.com/dot1mav/dot1mav/tree/gh-pages",
        backdropId: "source-backdrop",
        windowId: "source-window",
      };
    },

    createSourceWindow() {
      const cfg = this._sourceGuardsConfig();
      if (document.getElementById(cfg.backdropId)) {
        return {
          backdrop: document.getElementById(cfg.backdropId),
          win: document.getElementById(cfg.windowId),
        };
      }

      const backdrop = document.createElement("div");
      backdrop.id = cfg.backdropId;
      backdrop.className = "source-backdrop";

      const win = document.createElement("div");
      win.id = cfg.windowId;
      win.className = "window source-window";
      win.style.left = "50%";
      win.style.top = "50%";
      win.style.transform = "translate(-50%, -50%)";
      win.style.position = "fixed";
      win.style.zIndex = "100001";

      win.innerHTML = `
    <div class="title-bar" aria-label="Source notice titlebar">
      <div class="title-bar-text">MAV Portfolio – Source</div>
      <div class="title-bar-controls">
        <button data-action="min" aria-label="Minimize"></button>
        <button data-action="max" aria-label="Maximize"></button>
        <button data-action="close" aria-label="Close"></button>
      </div>
    </div>
    <div class="window-body">
      <h3 style="margin:0 0 8px;font-size:15px;font-weight:800;">Heads up – Source available</h3>
      <p style="margin:0 0 10px;line-height:1.4;">
        The frontend code for this site is public on GitHub. View, fork or contribute via the repository and the <code>gh-pages</code> branch.
      </p>
      <div class="notice-actions">
        <a class="notice-primary" href="${cfg.githubUrl}" target="_blank" rel="noopener noreferrer">Open repo (gh-pages)</a>
        <button class="notice-neutral" type="button" data-action="close-btn">Close</button>
      </div>
      <div style="margin-top:10px;font-size:12px;color:var(--border-dark);">
        Tip: the site uses compiled/minified assets. For issues/PRs, please use the GitHub repo.
      </div>
    </div>
  `;

      backdrop.appendChild(win);
      const appRoot = document.getElementById("app") || document.body;
      appRoot.appendChild(backdrop);

      const btnClose = win.querySelector('[data-action="close"]');
      const btnMin = win.querySelector('[data-action="min"]');
      const btnMax = win.querySelector('[data-action="max"]');
      const btnCloseAlt = win.querySelector('[data-action="close-btn"]');

      const repoLink = win.querySelector(".notice-primary");
      if (repoLink) {
        repoLink.addEventListener("click", (e) => {
          this.sendUmamiEvent("source_notice_repo_clicked", {
            window_title: "Source Code Notice",
            repo: "dot1mav/dot1mav",
            branch: "gh-pages",
          });
        });
      }

      const remove = () => {
        cleanup();
        if (backdrop && backdrop.parentNode)
          backdrop.parentNode.removeChild(backdrop);
      };

      btnClose && btnClose.addEventListener("click", remove);
      btnCloseAlt && btnCloseAlt.addEventListener("click", remove);

      btnMin &&
        btnMin.addEventListener("click", () => {
          win.style.display = "none";
          const restore = document.createElement("button");
          restore.textContent = "Restore source";
          restore.style.position = "absolute";
          restore.style.bottom = "18px";
          restore.style.left = "50%";
          restore.style.transform = "translateX(-50%)";
          restore.style.zIndex = "100002";
          restore.className = "notice-neutral";
          restore.addEventListener("click", () => {
            win.style.display = "";
            restore.remove();
          });
          backdrop.appendChild(restore);
        });

      btnMax &&
        btnMax.addEventListener("click", () => {
          if (win.classList.contains("maximized")) {
            win.classList.remove("maximized");
            win.style.left = win._prevLeft || "50%";
            win.style.top = win._prevTop || "50%";
            win.style.width = win._prevWidth || "";
            win.style.height = win._prevHeight || "";
            win.style.transform = "translate(-50%, -50%)";
          } else {
            win._prevLeft = win.style.left;
            win._prevTop = win.style.top;
            win._prevWidth = win.style.width;
            win._prevHeight = win.style.height;
            win.classList.add("maximized");
            win.style.left = "0";
            win.style.top = "0";
            win.style.width = window.innerWidth + "px";
            win.style.height = Math.max(window.innerHeight - 28, 200) + "px";
            win.style.transform = "";
          }
        });

      backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) {
        }
      });

      const titlebar = win.querySelector(".title-bar");
      let dragging = false;
      let offsetX = 0;
      let offsetY = 0;

      const onMouseDown = (ev) => {
        if (ev.target.closest(".title-bar-controls")) return;
        dragging = true;
        const rect = win.getBoundingClientRect();
        offsetX = ev.clientX - rect.left;
        offsetY = ev.clientY - rect.top;
        win.style.transform = "";
        win.style.position = "fixed";
        win.style.left = rect.left + "px";
        win.style.top = rect.top + "px";
        win.style.zIndex = "100001";
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
        ev.preventDefault();
      };

      const onMouseMove = (ev) => {
        if (!dragging) return;
        let newLeft = ev.clientX - offsetX;
        let newTop = ev.clientY - offsetY;
        newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - 100));
        newTop = Math.max(0, Math.min(newTop, window.innerHeight - 60));
        win.style.left = newLeft + "px";
        win.style.top = newTop + "px";
      };

      const onMouseUp = () => {
        if (!dragging) return;
        dragging = false;
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };

      titlebar.addEventListener("mousedown", onMouseDown);

      function cleanup() {
        titlebar.removeEventListener("mousedown", onMouseDown);
        btnClose && btnClose.removeEventListener("click", remove);
        btnCloseAlt && btnCloseAlt.removeEventListener("click", remove);
        btnMax && btnMax.removeEventListener("click", remove);
        btnMin && btnMin.removeEventListener("click", remove);
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      }

      return { backdrop, win, cleanup };
    },

    showSourceNotice() {
      const cfg = this._sourceGuardsConfig();
      if (!cfg.enableSourceGuards) return;
      const { backdrop } = this.createSourceWindow();
      backdrop.style.display = "flex";
      setTimeout(() => {
        backdrop.style.zIndex = 100000;
        const win = document.getElementById(cfg.windowId);
        if (win) win.style.zIndex = 100001;
      }, 0);

      this.sendUmamiEvent("source_notice_shown", {
        window_title: "Source Code Notice",
        repo: "dot1mav/dot1mav",
        branch: "gh-pages",
      });
    },

    installSourceGuards() {
      const cfg = this._sourceGuardsConfig();
      if (!cfg.enableSourceGuards) return;

      const onContext = (e) => {
        e.preventDefault();
        this.showSourceNotice();
      };
      document.addEventListener("contextmenu", onContext, { passive: false });

      const onKeyDown = (e) => {
        const key = e.key || "";
        const code = e.code || "";
        const ctrlOrCmd = e.ctrlKey || e.metaKey;

        if (code === "F12" || key === "F12" || e.keyCode === 123) {
          e.preventDefault();
          this.showSourceNotice();
          return;
        }
        if (
          ctrlOrCmd &&
          e.shiftKey &&
          (key.toLowerCase() === "i" || code === "KeyI")
        ) {
          e.preventDefault();
          this.showSourceNotice();
          return;
        }
        if (
          ctrlOrCmd &&
          e.shiftKey &&
          (key.toLowerCase() === "j" || code === "KeyJ")
        ) {
          e.preventDefault();
          this.showSourceNotice();
          return;
        }
        if (
          ctrlOrCmd &&
          e.shiftKey &&
          (key.toLowerCase() === "c" || code === "KeyC")
        ) {
          e.preventDefault();
          this.showSourceNotice();
          return;
        }
        if (
          ctrlOrCmd &&
          !e.shiftKey &&
          (key.toLowerCase() === "u" || code === "KeyU")
        ) {
          e.preventDefault();
          this.showSourceNotice();
          return;
        }
      };
      document.addEventListener("keydown", onKeyDown, { passive: false });

      this._sourceGuardsCleanup = () => {
        document.removeEventListener("contextmenu", onContext);
        document.removeEventListener("keydown", onKeyDown);
        const cfg2 = this._sourceGuardsConfig();
        const b = document.getElementById(cfg2.backdropId);
        if (b && b.parentNode) b.parentNode.removeChild(b);
      };
    },

    removeSourceGuards() {
      if (this._sourceGuardsCleanup) this._sourceGuardsCleanup();
    },
  },

  async mounted() {
    this.installSourceGuards();

    await this.loadData();

    this.initializeApp();

    this.updateIsMobile();
    window.addEventListener("resize", this.updateIsMobile);

    window.removeEventListener("resize", this.updateIsMobile);

    window.addEventListener("resize", () => {
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

    document.addEventListener(
      "click",
      (e) => {
        const a = e.target.closest && e.target.closest("a.btn-primary");
        if (!a) return;
        const card = a.closest && a.closest(".project-card");
        let projectTitle = null;
        if (card) {
          const titleEl =
            card.querySelector && card.querySelector(".project-title");
          if (titleEl) projectTitle = titleEl.innerText.trim();
        }
        this.sendUmamiEvent("project_demo_open", {
          project_title: projectTitle || null,
          demo: !!a.href,
        });
      },
      { passive: true }
    );

    console.log("MAV Portfolio loaded successfully! 🎉");
    console.log("Enjoy the Windows 98 nostalgia! 💾");
  },
}).mount("#app");
