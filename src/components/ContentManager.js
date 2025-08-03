import React, { useState } from 'react';

const CONTENT_TEMPLATES = {
  advanced_algorithms: {
    title: "Advanced Algorithm",
    description: "Advanced algorithm explanation with optimization techniques",
    duration: "45m",
    difficulty: "Advanced",
    topics: ["Algorithm", "Optimization", "Complexity Analysis"]
  },
  system_design: {
    title: "System Design",
    description: "System design walkthrough with scalability considerations",
    duration: "30m",
    difficulty: "Intermediate",
    topics: ["Architecture", "Scalability", "Database Design"]
  },
  interview_prep: {
    title: "Interview Preparation",
    description: "Company-specific interview preparation and strategies",
    duration: "60m",
    difficulty: "Advanced",
    topics: ["Coding", "Behavioral", "System Design"]
  },
  practice_problems: {
    title: "Practice Problems",
    description: "Curated problem set with detailed solutions",
    duration: "90m",
    difficulty: "Mixed",
    topics: ["Problem Solving", "Multiple Approaches", "Optimization"]
  },
  code_reviews: {
    title: "Code Review",
    description: "Expert code review with best practices",
    duration: "40m",
    difficulty: "Advanced",
    topics: ["Code Quality", "Performance", "Best Practices"]
  }
};

function ContentManager({ onClose }) {
  const [selectedCategory, setSelectedCategory] = useState('advanced_algorithms');
  const [newContent, setNewContent] = useState({
    title: '',
    description: '',
    duration: '',
    difficulty: 'Intermediate',
    topics: [],
    thumbnail: '',
    videoUrl: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewContent(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTopicsChange = (e) => {
    const topics = e.target.value.split(',').map(topic => topic.trim());
    setNewContent(prev => ({
      ...prev,
      topics
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically save to Firebase or your backend
    console.log('New content:', { ...newContent, category: selectedCategory });
    alert('Content added successfully! (This is a demo - content would be saved to database)');
    setNewContent({
      title: '',
      description: '',
      duration: '',
      difficulty: 'Intermediate',
      topics: [],
      thumbnail: '',
      videoUrl: ''
    });
  };

  const loadTemplate = () => {
    const template = CONTENT_TEMPLATES[selectedCategory];
    setNewContent({
      title: template.title,
      description: template.description,
      duration: template.duration,
      difficulty: template.difficulty,
      topics: template.topics,
      thumbnail: '',
      videoUrl: ''
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Content Manager
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl font-bold p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Content Form */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Add New Content
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  name="category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="advanced_algorithms">Advanced Algorithms</option>
                  <option value="system_design">System Design</option>
                  <option value="interview_prep">Interview Preparation</option>
                  <option value="practice_problems">Practice Problems</option>
                  <option value="code_reviews">Code Reviews</option>
                </select>
              </div>

              {/* Load Template Button */}
              <button
                type="button"
                onClick={loadTemplate}
                className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-2 rounded-lg transition-colors"
              >
                Load Template
              </button>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={newContent.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={newContent.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              {/* Duration and Difficulty */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Duration
                  </label>
                  <input
                    type="text"
                    name="duration"
                    value={newContent.duration}
                    onChange={handleInputChange}
                    placeholder="45m"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Difficulty
                  </label>
                  <select
                    name="difficulty"
                    value={newContent.difficulty}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              {/* Topics */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Topics (comma-separated)
                </label>
                <input
                  type="text"
                  name="topics"
                  value={newContent.topics.join(', ')}
                  onChange={handleTopicsChange}
                  placeholder="Algorithm, Optimization, Complexity"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Thumbnail URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Thumbnail URL
                </label>
                <input
                  type="url"
                  name="thumbnail"
                  value={newContent.thumbnail}
                  onChange={handleInputChange}
                  placeholder="https://example.com/thumbnail.jpg"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Video URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Video URL
                </label>
                <input
                  type="url"
                  name="videoUrl"
                  value={newContent.videoUrl}
                  onChange={handleInputChange}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 rounded-lg transition-all duration-200"
              >
                Add Content
              </button>
            </form>
          </div>

          {/* Content Preview */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Content Preview
            </h3>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="relative">
                {newContent.thumbnail ? (
                  <img 
                    src={newContent.thumbnail} 
                    alt={newContent.title}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center">
                    <span className="text-gray-500 dark:text-gray-400">Thumbnail Preview</span>
                  </div>
                )}
                <div className="absolute top-2 right-2">
                                      <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      Pro
                    </span>
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">
                  {newContent.title || 'Content Title'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-xs mb-3">
                  {newContent.description || 'Content description will appear here...'}
                </p>
                
                {/* Topics Preview */}
                {newContent.topics.length > 0 && (
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-1">
                      {newContent.topics.slice(0, 3).map((topic, index) => (
                        <span key={index} className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-1 rounded">
                          {topic}
                        </span>
                      ))}
                      {newContent.topics.length > 3 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
                          +{newContent.topics.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ⏱️ {newContent.duration || 'Duration'}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    newContent.difficulty === 'Advanced' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                    newContent.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                  }`}>
                    {newContent.difficulty}
                  </span>
                </div>
                
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg transition-colors">
                  Start Learning
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContentManager; 