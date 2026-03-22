import axios from 'axios';
import React, { useState } from 'react';
import { Search, Youtube, Play, ExternalLink, Sparkles, BookOpen, Loader2, Layout, ChevronRight } from 'lucide-react';

const YoutubeHelper = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  // Topic to channel mapping with real educational YouTube channels
  const getRecommendedChannels = (searchQuery) => {
    const lowerQuery = searchQuery.toLowerCase();

    // Map topics to specific real YouTube channels
    const topicChannelMap = {
      'operating system': ['Gate Smashers', 'Neso Academy', 'Abdul Bari'],
      'os': ['Gate Smashers', 'Neso Academy', 'Knowledge Gate'],
      'deadlock': ['Gate Smashers', 'Neso Academy', 'Education 4u'],
      'dbms': ['Gate Smashers', 'Knowledge Gate', 'Neso Academy'],
      'database': ['freeCodeCamp.org', 'Programming with Mosh', 'Traversy Media'],
      'normalization': ['Gate Smashers', 'Neso Academy', 'Education 4u'],
      'sql': ['freeCodeCamp.org', 'Programming with Mosh', 'Traversy Media'],
      'algorithm': ['Abdul Bari', 'Jenny\'s Lectures', 'Gate Smashers'],
      'data structure': ['Abdul Bari', 'Jenny\'s Lectures', 'mycodeschool'],
      'networking': ['Gate Smashers', 'Neso Academy', 'PowerCert Animated Videos'],
      'tcp': ['Gate Smashers', 'Neso Academy', 'PowerCert Animated Videos'],
      'computer network': ['Gate Smashers', 'Neso Academy', 'Knowledge Gate'],
      'java': ['Programming with Mosh', 'Telusko', 'Amigoscode'],
      'python': ['freeCodeCamp.org', 'Corey Schafer', 'Programming with Mosh'],
      'javascript': ['Traversy Media', 'freeCodeCamp.org', 'The Net Ninja'],
      'react': ['Traversy Media', 'freeCodeCamp.org', 'Codevolution'],
      'web development': ['Traversy Media', 'freeCodeCamp.org', 'The Net Ninja'],
      'machine learning': ['StatQuest with Josh Starmer', 'Krish Naik', 'freeCodeCamp.org'],
      'ai': ['StatQuest with Josh Starmer', 'Sentdex', 'Two Minute Papers'],
      'compiler': ['Gate Smashers', 'Neso Academy', 'Knowledge Gate'],
      'theory of computation': ['Neso Academy', 'Gate Smashers', 'Knowledge Gate']
    };

    // Find matching channels
    let channels = ['Gate Smashers', 'freeCodeCamp.org', 'Neso Academy']; // defaults
    for (const [topic, channelList] of Object.entries(topicChannelMap)) {
      if (lowerQuery.includes(topic)) {
        channels = channelList;
        break;
      }
    }

    return channels;
  };

  /*const handleSearch = (e) => {
    e.preventDefault();
    if (!query) return;
    setLoading(true);

   // setTimeout(() => {
     // const recommendedChannels = getRecommendedChannels(query);
      //const searchQuery = encodeURIComponent(query);

      // Create results with real YouTube channels and search links
      const videoResults = recommendedChannels.map((channel, index) => ({
        id: index + 1,
        title: `${query} - ${channel}`,
        channel: channel,
        duration: 'Search',
      //thumbnail: `https://images.unsplash.com/photo-${['1517694712202-14dd9538aa97', '1555066931-4365d14bab8c', '1516321318423-f06f85e504b3'][index % 3]
         // }?w=400&h=225&fit=crop`,
        // thumbnail: `https://source.unsplash.com/400x225/?${encodeURIComponent(query)},programming`,
       thumbnail: `https://picsum.photos/400/225?random=${query}${index}`,

        desc: `Learn about ${query} from ${channel}, one of the best educational channels for this topic.`,
        youtubeUrl: `https://www.youtube.com/results?search_query=${searchQuery}+${encodeURIComponent(channel)}`
      }));

      setResults(videoResults);
      setLoading(false);
    }, 1000);
  };*/
  const handleSearch = async (e) => {
  e.preventDefault();
  if (!query) return;

  setLoading(true);

  try {
    const response = await axios.get(
      "https://www.googleapis.com/youtube/v3/search",
      {
        params: {
          part: "snippet",
          q: query,
          type: "video",
          maxResults: 6,
          key: "AIzaSyD0jEUoxgLhsKdQbNH0ugofnozxaDTbrGU",
        },
      }
    );

    const videos = response.data.items.map((item) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      channel: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.medium.url,
      youtubeUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      desc: item.snippet.description,
    }));

    setResults(videos);
  } catch (error) {
    console.error("Error fetching YouTube videos:", error);
  }

  setLoading(false);
};


  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <header className="text-center">
        <div className="inline-flex p-3 bg-red-500/10 text-red-500 rounded-2xl mb-4">
          <Youtube size={32} />
        </div>
        <h1 className="text-3xl font-bold text-white">YouTube Topic Helper</h1>
        <p className="text-slate-400 mt-2 max-w-xl mx-auto">
          Struggling with a concept? Tell us what you want to learn, and we'll find the best tutorials and materials.
        </p>
      </header>

      {/* Search Bar */}
      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleSearch} className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none group-focus-within:text-primary-400 text-slate-500 transition-colors">
            <Search size={24} />
          </div>
          <input
            type="text"
            placeholder="e.g. Explain Deadlock in DBMS"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-slate-900 border-2 border-slate-800 text-white text-lg rounded-2xl py-5 pl-14 pr-32 focus:outline-none focus:border-primary-500/50 focus:ring-4 focus:ring-primary-500/10 transition-all font-medium"
          />
          <button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-primary-600 hover:bg-primary-700 text-white font-bold px-6 py-3 rounded-xl transition-all flex items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
            <span>Get Help</span>
          </button>
        </form>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl h-80 animate-pulse" />
          ))
        ) : (
          results.map((video) => (
            <div key={video.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden group hover:border-primary-500/50 transition-all hover:-translate-y-1">
              <div className="relative aspect-video">
                <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all" />
                <div className="absolute bottom-2 right-2 bg-black/80 text-[10px] font-bold text-white px-2 py-0.5 rounded">
                  {video.duration}
                </div>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center">
                    <Play size={24} fill="currentColor" />
                  </div>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 text-[10px] font-bold text-primary-400 uppercase tracking-widest mb-2">
                  <Youtube size={12} />
                  <span>Verified Tutorial</span>
                </div>
                <h3 className="text-white font-bold group-hover:text-primary-400 transition-colors line-clamp-1">{video.title}</h3>
                <p className="text-slate-500 text-xs mt-1">{video.channel}</p>
                <p className="text-slate-400 text-sm mt-3 line-clamp-2">{video.desc}</p>

                <div className="mt-6 flex items-center justify-between">
                  <a
                    href={video.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary-500 hover:text-primary-400 text-xs font-bold transition-colors"
                  >
                    <ExternalLink size={14} />
                    Watch on YouTube
                  </a>
                  <button className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors">
                    <BookOpen size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Recommended Topics */}
      {!results.length && !loading && (
        <section className="pt-8">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest text-center mb-6">Popular Doubt Topics</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {['TCP/IP Layer Model', 'Normalization in DBMS', 'Virtual Memory OS', 'Quick Sort Algorithm', 'Process Sync'].map(tag => (
              <button
                key={tag}
                onClick={() => setQuery(tag)}
                className="bg-slate-800/50 border border-slate-700 text-slate-300 px-4 py-2 rounded-full text-sm hover:border-primary-500/50 hover:bg-slate-800 transition-all"
              >
                {tag}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default YoutubeHelper;