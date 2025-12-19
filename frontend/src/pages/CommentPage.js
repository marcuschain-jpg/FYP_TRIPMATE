import React, { useState } from 'react';
import '../styles/Comment.css'; // Updated CSS import

// Mock data for comments
const mockComments = [
    { id: 1, user: "JamesCharles", text: "WOW, you guys look so cute!", time: "1 hour ago" },
    { id: 2, user: "KondikKumar", text: "I'm going to Thailand next week too! I appreciate the tips and tricks.", time: "45 minutes ago" },
    { id: 3, user: "Jesse", text: "TRAVEL!!!!", time: "30 minutes ago" },
    { id: 4, user: "JohnSmith", text: "So cool!", time: "10 minutes ago" },
];

function CommentPage({ post, onClose }) {
    if (!post) return null;

    const [commentText, setCommentText] = useState('');
    const [comments, setComments] = useState(mockComments); 

    const handlePostComment = () => {
        if (commentText.trim() === "") return;

        const newComment = {
            id: Date.now(),
            user: "CurrentUser", // Placeholder
            text: commentText,
            time: "Just now",
        };

        setComments([newComment, ...comments]); 
        setCommentText(''); 
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="comment-modal" onClick={(e) => e.stopPropagation()}>
                
                <div className="modal-header">
                    <h3>Comments</h3>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                {/* Post Preview Section */}
                <div className="post-preview">
                    {/* Placeholder image that reflects the post's image */}
                    <div 
                        className="post-preview-image"
                        style={{ backgroundImage: `url(${post.image})` }}
                    >
                        {/* Title overlay */}
                        <div className="post-preview-title">{post.title}</div>
                    </div>
                    {/* Post Text */}
                    <p className="post-preview-text">{post.text.substring(0, 100)}...</p>
                </div>

                {/* Comments List */}
                <div className="comments-list">
                    {comments.map((comment) => (
                        <div key={comment.id} className="comment-item">
                            <div className="comment-user">
                                <strong>{comment.user}</strong>
                                <span className="comment-time">{comment.time}</span>
                            </div>
                            <p className="comment-text">{comment.text}</p>
                        </div>
                    ))}
                </div>

                {/* Comment Input */}
                <div className="comment-input-area">
                    <input
                        type="text"
                        placeholder="Add a comment..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                    />
                    <button onClick={handlePostComment} className="post-comment-btn">
                        Post
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CommentPage;