// Portfolio Website - Professional portfolio template
export const portfolio = {
  name: "Portfolio Website",
  files: {
    "App.jsx": `import Hero from "./components/Hero";
import About from "./components/About";
import Projects from "./components/Projects";
import Skills from "./components/Skills";
import Contact from "./components/Contact";
import Navbar from "./components/Navbar";

export default function App() {
  const scrollToSection = (sectionId) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onNavigate={scrollToSection} />
      <Hero onNavigate={scrollToSection} />
      <About />
      <Projects />
      <Skills />
      <Contact />
    </div>
  );
}`,

    "components/Navbar.jsx": `import { useState, useEffect } from "react";

export default function Navbar({ onNavigate }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={\`
        fixed top-0 left-0 right-0 z-50 transition-all duration-300
        \${scrolled ? "bg-white shadow-lg py-4" : "bg-transparent py-6"}
      \`}
    >
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
        <h1 className={\`text-2xl font-bold \${scrolled ? "text-gray-900" : "text-white"}\`}>
          Portfolio
        </h1>

        <div className="flex items-center space-x-8">
          {["about", "projects", "skills", "contact"].map(section => (
            <button
              key={section}
              onClick={() => onNavigate(section)}
              className={\`
                font-medium capitalize transition
                \${scrolled
                  ? "text-gray-700 hover:text-blue-600"
                  : "text-white hover:text-blue-300"
                }
              \`}
            >
              {section}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}`,

    "components/Hero.jsx": `export default function Hero({ onNavigate }) {
  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-300 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 text-center px-6">
        <div className="mb-6">
          <div className="w-32 h-32 mx-auto bg-white rounded-full flex items-center justify-center text-6xl shadow-2xl">
            👋
          </div>
        </div>

        <h1 className="text-6xl md:text-7xl font-bold mb-6">
          Hi, I'm <span className="text-yellow-300">Your Name</span>
        </h1>

        <p className="text-2xl md:text-3xl text-blue-100 mb-8 max-w-3xl mx-auto">
          Full-Stack Developer & Creative Problem Solver
        </p>

        <p className="text-lg text-blue-200 mb-12 max-w-2xl mx-auto">
          I build beautiful, functional web applications that solve real problems.
          Passionate about clean code, great UX, and continuous learning.
        </p>

        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={() => onNavigate("projects")}
            className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition shadow-lg hover:shadow-xl"
          >
            View My Work
          </button>
          <button
            onClick={() => onNavigate("contact")}
            className="px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-xl hover:bg-white/10 transition"
          >
            Get in Touch
          </button>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  );
}`,

    "components/About.jsx": `export default function About() {
  return (
    <section id="about" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
          About Me
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <img
              src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=400&fit=crop"
              alt="Workspace"
              className="rounded-2xl shadow-2xl"
            />
          </div>

          <div>
            <p className="text-lg text-gray-700 mb-6">
              I'm a passionate developer with 5+ years of experience building web applications.
              I specialize in React, Node.js, and modern web technologies.
            </p>

            <p className="text-lg text-gray-700 mb-6">
              My journey in tech started with a curiosity about how websites work, and it's evolved
              into a career I love. I'm always learning new technologies and best practices.
            </p>

            <p className="text-lg text-gray-700">
              When I'm not coding, you can find me reading tech blogs, contributing to open source,
              or exploring new coffee shops with my laptop.
            </p>

            <div className="mt-8 flex items-center space-x-4">
              <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                Download Resume →
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}`,

    "components/Projects.jsx": `export default function Projects() {
  const projects = [
    {
      title: "E-Commerce Platform",
      description: "A full-featured e-commerce platform with cart, checkout, and admin dashboard.",
      image: "https://images.unsplash.com/photo-1557821552-17105176677c?w=600&h=400&fit=crop",
      tags: ["React", "Node.js", "MongoDB"],
      github: "#",
      demo: "#"
    },
    {
      title: "Task Management App",
      description: "Collaborative task management with real-time updates and team features.",
      image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=400&fit=crop",
      tags: ["React", "Firebase", "Tailwind"],
      github: "#",
      demo: "#"
    },
    {
      title: "Weather Dashboard",
      description: "Beautiful weather app with forecasts, maps, and location-based alerts.",
      image: "https://images.unsplash.com/photo-1592210454359-9043f067919b?w=600&h=400&fit=crop",
      tags: ["React", "API", "Charts"],
      github: "#",
      demo: "#"
    },
    {
      title: "Social Media Dashboard",
      description: "Analytics dashboard for tracking social media metrics across platforms.",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop",
      tags: ["React", "D3.js", "REST API"],
      github: "#",
      demo: "#"
    }
  ];

  return (
    <section id="projects" className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
          Featured Projects
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {projects.map((project, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300"
            >
              <img
                src={project.image}
                alt={project.title}
                className="w-full h-48 object-cover"
              />

              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {project.title}
                </h3>

                <p className="text-gray-600 mb-4">
                  {project.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {project.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center space-x-4">
                  <a
                    href={project.github}
                    className="text-gray-700 hover:text-blue-600 font-medium transition"
                  >
                    GitHub →
                  </a>
                  <a
                    href={project.demo}
                    className="text-gray-700 hover:text-blue-600 font-medium transition"
                  >
                    Live Demo →
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,

    "components/Skills.jsx": `export default function Skills() {
  const skillCategories = [
    {
      name: "Frontend",
      skills: ["React", "TypeScript", "Tailwind CSS", "Next.js", "Redux"]
    },
    {
      name: "Backend",
      skills: ["Node.js", "Express", "PostgreSQL", "MongoDB", "REST APIs"]
    },
    {
      name: "Tools & Others",
      skills: ["Git", "Docker", "AWS", "Jest", "Figma"]
    }
  ];

  return (
    <section id="skills" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
          Skills & Technologies
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {skillCategories.map((category, index) => (
            <div key={index} className="bg-gray-50 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                {category.name}
              </h3>

              <div className="space-y-3">
                {category.skills.map(skill => (
                  <div key={skill} className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-gray-700 font-medium">{skill}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,

    "components/Contact.jsx": `import { useState } from "react";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Form submitted! (This is a demo)");
    setFormData({ name: "", email: "", message: "" });
  };

  return (
    <section id="contact" className="py-20 bg-gradient-to-br from-blue-600 to-purple-600 text-white">
      <div className="max-w-4xl mx-auto px-6">
        <h2 className="text-4xl font-bold text-center mb-12">
          Get In Touch
        </h2>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                placeholder="your.email@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Message</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
                rows={5}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 resize-none"
                placeholder="Tell me about your project..."
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition shadow-lg"
            >
              Send Message
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/20 flex justify-center space-x-6">
            <a href="#" className="hover:text-blue-300 transition">LinkedIn</a>
            <a href="#" className="hover:text-blue-300 transition">GitHub</a>
            <a href="#" className="hover:text-blue-300 transition">Twitter</a>
          </div>
        </div>
      </div>
    </section>
  );
}`
  }
};
