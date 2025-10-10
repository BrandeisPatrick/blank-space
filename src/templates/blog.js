// Personal Blog - A clean, customizable blog template
export const blog = {
  name: "Personal Blog",
  files: {
    "App.jsx": `import { useState } from "react";
import Header from "./components/Header";
import BlogPost from "./components/BlogPost";
import Sidebar from "./components/Sidebar";
import Footer from "./components/Footer";

export default function App() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const posts = [
    {
      id: 1,
      title: "Getting Started with React Hooks",
      excerpt: "Learn how to use React Hooks to manage state and side effects in your functional components.",
      content: "React Hooks have revolutionized how we write React components...",
      category: "React",
      author: "John Doe",
      date: "2024-01-15",
      readTime: "5 min read",
      image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=400&fit=crop"
    },
    {
      id: 2,
      title: "CSS Grid vs Flexbox: When to Use Each",
      excerpt: "Understanding the differences between CSS Grid and Flexbox helps you choose the right tool for your layout needs.",
      content: "Both CSS Grid and Flexbox are powerful layout tools...",
      category: "CSS",
      author: "Jane Smith",
      date: "2024-01-12",
      readTime: "7 min read",
      image: "https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=800&h=400&fit=crop"
    },
    {
      id: 3,
      title: "Building Accessible Web Applications",
      excerpt: "Accessibility is not optional. Learn best practices for making your web apps usable by everyone.",
      content: "Web accessibility ensures that people with disabilities can use your website...",
      category: "Accessibility",
      author: "John Doe",
      date: "2024-01-10",
      readTime: "6 min read",
      image: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&h=400&fit=crop"
    },
    {
      id: 4,
      title: "Modern JavaScript ES2024 Features",
      excerpt: "Explore the latest JavaScript features that make your code cleaner and more efficient.",
      content: "JavaScript continues to evolve with new features every year...",
      category: "JavaScript",
      author: "Jane Smith",
      date: "2024-01-08",
      readTime: "8 min read",
      image: "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=800&h=400&fit=crop"
    }
  ];

  const categories = ["all", ...new Set(posts.map(post => post.category))];

  const filteredPosts = posts.filter(post => {
    const matchesCategory = selectedCategory === "all" || post.category === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-white">
      <Header onSearch={setSearchQuery} />

      {/* Hero Section */}
      <div className="bg-black text-white py-24">
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="text-6xl font-bold mb-6 tracking-tight">Welcome to My Blog</h1>
          <p className="text-xl text-gray-300 max-w-2xl leading-relaxed">
            Sharing thoughts, tutorials, and insights about web development, design, and technology.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Blog Posts */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-3xl font-bold text-black">Latest Posts</h2>
              <span className="text-gray-500 text-sm">{filteredPosts.length} articles</span>
            </div>

            <div className="space-y-12">
              {filteredPosts.map(post => (
                <BlogPost key={post.id} post={post} />
              ))}
            </div>

            {filteredPosts.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                No posts found. Try a different search or category.
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div>
            <Sidebar
              categories={categories}
              selectedCategory={selectedCategory}
              onCategorySelect={setSelectedCategory}
              recentPosts={posts.slice(0, 3)}
            />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}`,

    "components/Header.jsx": `import { useState } from "react";

export default function Header({ onSearch }) {
  const [searchInput, setSearchInput] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch(searchInput);
  };

  const handleNavClick = (page) => {
    console.log("Navigating to:", page);
    // Add your navigation logic here
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-12">
            <h1 className="text-2xl font-bold text-black tracking-tight">
              MyBlog
            </h1>
            <nav className="hidden md:flex space-x-8">
              <button onClick={() => handleNavClick("home")} className="text-gray-600 hover:text-black font-medium transition cursor-pointer">
                Home
              </button>
              <button onClick={() => handleNavClick("about")} className="text-gray-600 hover:text-black font-medium transition cursor-pointer">
                About
              </button>
              <button onClick={() => handleNavClick("contact")} className="text-gray-600 hover:text-black font-medium transition cursor-pointer">
                Contact
              </button>
            </nav>
          </div>

          <form onSubmit={handleSearch} className="flex items-center">
            <input
              type="text"
              placeholder="Search..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="px-4 py-2 border border-gray-300 focus:outline-none focus:border-black transition"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-black text-white hover:bg-gray-800 transition cursor-pointer"
            >
              Search
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}`,

    "components/BlogPost.jsx": `export default function BlogPost({ post }) {
  const handleReadMore = () => {
    console.log('Reading post:', post.title);
    // Add your navigation logic here
  };

  return (
    <article className="border-b border-gray-200 pb-12">
      <img
        src={post.image}
        alt={post.title}
        className="w-full h-80 object-cover mb-6"
      />
      <div>
        <div className="flex items-center space-x-4 mb-4">
          <span className="px-3 py-1 bg-black text-white text-xs font-medium uppercase tracking-wide">
            {post.category}
          </span>
          <span className="text-gray-400 text-sm">{post.readTime}</span>
        </div>

        <h2 className="text-3xl font-bold text-black mb-4 hover:text-gray-600 cursor-pointer transition">
          {post.title}
        </h2>

        <p className="text-gray-600 mb-6 text-lg leading-relaxed">
          {post.excerpt}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-black flex items-center justify-center text-white font-semibold">
              {post.author[0]}
            </div>
            <div>
              <p className="text-sm font-medium text-black">{post.author}</p>
              <p className="text-sm text-gray-500">{post.date}</p>
            </div>
          </div>

          <button
            onClick={handleReadMore}
            className="px-6 py-2 bg-black text-white hover:bg-gray-800 transition cursor-pointer font-medium"
          >
            Read More →
          </button>
        </div>
      </div>
    </article>
  );
}`,

    "components/Sidebar.jsx": `export default function Sidebar({ categories, selectedCategory, onCategorySelect, recentPosts }) {
  const handleSubscribe = (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    console.log('Subscribing email:', email);
    // Add your subscription logic here
  };

  const handlePostClick = (post) => {
    console.log('Navigating to post:', post.title);
    // Add your navigation logic here
  };

  return (
    <aside className="space-y-8">
      {/* Categories */}
      <div className="border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-black mb-6">Categories</h3>
        <div className="space-y-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => onCategorySelect(category)}
              className={\`
                w-full text-left px-4 py-2 transition cursor-pointer font-medium
                \${selectedCategory === category
                  ? "bg-black text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                }
              \`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Recent Posts */}
      <div className="border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-black mb-6">Recent Posts</h3>
        <div className="space-y-4">
          {recentPosts.map(post => (
            <div
              key={post.id}
              onClick={() => handlePostClick(post)}
              className="group cursor-pointer border-b border-gray-100 pb-4 last:border-0"
            >
              <h4 className="font-medium text-black group-hover:text-gray-600 transition mb-1">
                {post.title}
              </h4>
              <p className="text-sm text-gray-500">{post.date}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Newsletter */}
      <div className="bg-black p-6 text-white">
        <h3 className="text-xl font-bold mb-2">Newsletter</h3>
        <p className="text-gray-300 mb-6 text-sm">
          Get the latest posts delivered right to your inbox.
        </p>
        <form onSubmit={handleSubscribe}>
          <input
            type="email"
            name="email"
            placeholder="Your email"
            required
            className="w-full px-4 py-2 mb-3 text-black focus:outline-none border border-gray-300 focus:border-black"
          />
          <button
            type="submit"
            className="w-full bg-white text-black px-4 py-2 font-semibold hover:bg-gray-200 transition cursor-pointer"
          >
            Subscribe
          </button>
        </form>
      </div>
    </aside>
  );
}`,

    "components/Footer.jsx": `export default function Footer() {
  const handleSocialClick = (platform) => {
    console.log('Opening social platform:', platform);
    // Add your social media navigation logic here
  };

  const handleLinkClick = (link) => {
    console.log('Navigating to:', link);
    // Add your navigation logic here
  };

  return (
    <footer className="border-t border-gray-200 py-16 mt-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <h3 className="text-black font-bold text-xl mb-4">MyBlog</h3>
            <p className="text-gray-600 leading-relaxed">
              Sharing knowledge and insights about web development and design.
            </p>
          </div>

          <div>
            <h4 className="text-black font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <button onClick={() => handleLinkClick('home')} className="text-gray-600 hover:text-black transition cursor-pointer">
                  Home
                </button>
              </li>
              <li>
                <button onClick={() => handleLinkClick('about')} className="text-gray-600 hover:text-black transition cursor-pointer">
                  About
                </button>
              </li>
              <li>
                <button onClick={() => handleLinkClick('privacy')} className="text-gray-600 hover:text-black transition cursor-pointer">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => handleLinkClick('contact')} className="text-gray-600 hover:text-black transition cursor-pointer">
                  Contact
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-black font-semibold mb-4">Follow Me</h4>
            <div className="flex space-x-3">
              <button
                onClick={() => handleSocialClick('twitter')}
                className="w-12 h-12 border border-gray-300 flex items-center justify-center hover:bg-black hover:text-white hover:border-black transition cursor-pointer font-semibold"
              >
                T
              </button>
              <button
                onClick={() => handleSocialClick('github')}
                className="w-12 h-12 border border-gray-300 flex items-center justify-center hover:bg-black hover:text-white hover:border-black transition cursor-pointer font-semibold"
              >
                G
              </button>
              <button
                onClick={() => handleSocialClick('linkedin')}
                className="w-12 h-12 border border-gray-300 flex items-center justify-center hover:bg-black hover:text-white hover:border-black transition cursor-pointer font-semibold"
              >
                L
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-12 pt-8 text-center text-gray-500 text-sm">
          <p>&copy; 2024 MyBlog. Built with React. Customize as you like!</p>
        </div>
      </div>
    </footer>
  );
}`
  }
};
