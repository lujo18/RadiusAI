import React from "react";
import { FiClock } from 'react-icons/fi';

interface CalendarTabProps {
  upcomingPosts: any[];
}

export default function CalendarTab({ upcomingPosts }: CalendarTabProps) {
  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">Content Calendar</h1>
      
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">November 2025</h2>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg">Previous</button>
            <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg">Next</button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center font-semibold text-gray-400 pb-2">{day}</div>
          ))}
          {Array.from({ length: 30 }, (_, i) => i + 1).map(day => (
            <div key={day} className="aspect-square bg-gray-900/50 rounded-lg p-2 hover:bg-gray-700 cursor-pointer">
              <div className="text-sm mb-1">{day}</div>
              {day % 7 !== 0 && (
                <div className="space-y-1">
                  <div className="text-xs bg-pink-500/20 text-pink-400 px-1 rounded">7 IG</div>
                  <div className="text-xs bg-blue-500/20 text-blue-400 px-1 rounded">7 TT</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-4">All Scheduled Posts</h2>
        <div className="space-y-3">
          {upcomingPosts.map((post: any) => (
            <PostRow key={post.id} post={post} />
          ))}
        </div>
      </div>
    </div>
  );
}

function PostRow({ post }: any) {
  return (
    <div className="flex items-center justify-between bg-gray-900/50 p-3 rounded-lg">
      <div className="flex items-center gap-3">
        <FiClock className="text-gray-400" />
        <span className="text-sm">{post.time}</span>
        <span className="text-sm text-gray-400">{post.platform}</span>
        <span className="text-sm">{post.title}</span>
      </div>
      <div className="flex gap-2">
        <button className="text-sm text-blue-400 hover:text-blue-300">Edit</button>
        <button className="text-sm text-red-400 hover:text-red-300">Delete</button>
      </div>
    </div>
  );
}
