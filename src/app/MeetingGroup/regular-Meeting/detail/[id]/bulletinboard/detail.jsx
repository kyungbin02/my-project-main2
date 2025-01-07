// src/app/MeetingGroup/regular-Meeting/detail/[id]/bulletinboard/detail.jsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Avatar,
  IconButton,
  TextField,
  Button,
  Modal,
  CircularProgress,
  Divider,
  Menu as MuiMenu,
  MenuItem as MuiMenuItem,
  Snackbar,
  Popover,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SendIcon from "@mui/icons-material/Send";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";

import axios from "axios";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination as SwiperPagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import useAuthStore from 'store/authStore';
import { getCookie } from 'cookies-next';
import { useRouter } from 'next/navigation';

import { motion, AnimatePresence } from "framer-motion";
import Picker from "emoji-picker-react";
import { styled } from "@mui/material/styles";

// Styled Components
const StyledSendButton = styled(IconButton)(({ theme }) => ({
  color: "#1976d2",
  "&:hover": {
    backgroundColor: "rgba(25, 118, 210, 0.1)",
  },
}));

// 댓글 수정 모달 컴포넌트 정의
function EditCommentModal({ open, comment, onClose, onSuccess }) {
  const [newContent, setNewContent] = useState("");

  useEffect(() => {
    if (comment) {
      setNewContent(comment.comment_content);
    }
  }, [comment]);

  const handleSubmit = async () => {
    if (!newContent.trim()) {
      alert("내용을 입력하세요.");
      return;
    }
    try {
      const url = `http://localhost:8080/api/regular-meeting-board/comments/${comment.comment_idx}`;
      await axios.put(
        url,
        { comment_content: newContent },
        {
          headers: { Authorization: `Bearer ${useAuthStore.getState().token}` },
        }
      );
      alert("댓글이 수정되었습니다.");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("댓글 수정 실패:", error);
      alert(
        `댓글 수정 실패: ${
          error.response?.data?.error || "알 수 없는 오류"
        }`
      );
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: { xs: "90%", md: "400px" },
          bgcolor: "background.paper",
          borderRadius: "8px",
          boxShadow: 24,
          p: 4,
        }}
      >
        <Typography variant="h6" component="h2" gutterBottom>
          댓글 수정
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={4}
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          variant="outlined"
          placeholder="댓글 내용을 입력하세요."
          aria-label="수정된 댓글 내용"
        />
        <Box sx={{ display: "flex", justifyContent: "flex-end", marginTop: 2 }}>
          <Button onClick={onClose} sx={{ marginRight: 1 }} aria-label="취소">
            취소
          </Button>
          <Button variant="contained" onClick={handleSubmit} aria-label="댓글 저장">
            저장
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}

// Comment 컴포넌트 정의
const Comment = ({
  comment,
  onEdit,
  onDelete,
  onReply,
  depth = 0, // depth prop 추가
  replyingCommentId, // 현재 답글 입력 중인 댓글 ID
  setReplyingCommentId, // 답글 입력 중인 댓글 ID 설정 함수
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const emojiButtonRef = useRef(null);
  const [emojiPopoverAnchor, setEmojiPopoverAnchor] = useState(null);

  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    handleMenuClose();
    onEdit(comment);
  };

  const handleDelete = () => {
    handleMenuClose();
    onDelete(comment);
  };

  const handleReply = () => {
    if (replyingCommentId === comment.comment_idx) {
      setReplyingCommentId(null); // 이미 답글 입력 중이면 닫기
    } else {
      setReplyingCommentId(comment.comment_idx); // 답글 입력 중인 댓글 ID 설정
    }
  };

  const handleReplySubmit = () => {
    if (!replyContent.trim()) {
      setSnackbarMessage("대댓글을 입력하세요.");
      setSnackbarOpen(true);
      return;
    }
    onReply(comment, replyContent);
    setReplyContent("");
    // 답글 입력창을 닫지 않음
  };

  const isReplying = replyingCommentId === comment.comment_idx;

  const onEmojiClick = (emojiData) => {
    if (emojiData && emojiData.emoji) {
      setReplyContent((prev) => prev + emojiData.emoji);
    }
    setEmojiPopoverAnchor(null);
  };

  const handleEmojiButtonClick = (event) => {
    event.stopPropagation();
    setEmojiPopoverAnchor(event.currentTarget);
  };

  const handleEmojiPopoverClose = () => {
    setEmojiPopoverAnchor(null);
  };

  // 대댓글 수 계산
  const replyCount = comment.children ? comment.children.length : 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
      >
        <Box sx={{ marginLeft: depth * 4, marginTop: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Avatar
              src={comment.user?.avatar_url || "/images/default-avatar.jpg"}
              alt={comment.user?.username || "익명"}
              sx={{ width: 30, height: 30, marginRight: 1 }}
            />
            <Typography variant="body2" fontWeight="bold">
              {comment.user?.username || "익명"}
            </Typography>
            <Typography variant="caption" color="textSecondary" sx={{ marginLeft: 1 }}>
              {new Date(comment.uploaded_at).toLocaleString()}
            </Typography>
            {/* 작성자만 수정/삭제 메뉴 표시 */}
            {comment.user?.user_idx === useAuthStore.getState().user?.user_idx && (
              <IconButton
                size="small"
                onClick={handleMenuOpen}
                sx={{ marginLeft: "auto" }}
                aria-label="댓글 메뉴"
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            )}
            <MuiMenu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              anchorOrigin={{
                vertical: "top",
                horizontal: "left",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "left",
              }}
            >
              <MuiMenuItem onClick={handleEdit} aria-label="댓글 수정">
                <EditIcon fontSize="small" sx={{ marginRight: 1 }} />
                수정
              </MuiMenuItem>
              <MuiMenuItem onClick={handleDelete} aria-label="댓글 삭제">
                <DeleteIcon fontSize="small" sx={{ marginRight: 1 }} />
                삭제
              </MuiMenuItem>
            </MuiMenu>
          </Box>
          <Typography variant="body2" sx={{ marginLeft: 4, marginTop: 0.5 }}>
            {comment.comment_content}
          </Typography>
          <Box sx={{ marginLeft: 4, marginTop: 0.5, display: "flex", gap: 1 }}>
            {/* 대댓글 작성은 depth가 0일 때만 가능 */}
            {depth < 1 && (
              <Button size="small" onClick={handleReply} aria-label="답글 작성">
                답글 ({replyCount})
              </Button>
            )}
            {/* 필요에 따라 좋아요 기능 추가 가능 */}
            {/* 예시: 좋아요 버튼 */}
            {/* <IconButton size="small" aria-label="좋아요">
              <FavoriteBorderIcon fontSize="small" />
            </IconButton> */}
          </Box>

          {/* 대댓글 입력창 및 대댓글 목록을 replying 상태에 따라 토글 */}
          {isReplying && depth < 1 && (
            <Box
              sx={{
                marginLeft: 4,
                marginTop: 1,
                display: "flex",
                flexDirection: "column",
                gap: 1,
              }}
            >
              {/* 대댓글 입력창 */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "8px",
                  position: "relative", // 부모 Box에 position: relative 추가
                }}
              >
                <Avatar
                  src={useAuthStore.getState().user?.avatar_url || "/images/default-avatar.jpg"}
                  alt={useAuthStore.getState().user?.username || "익명"}
                  sx={{ width: 24, height: 24 }}
                />
                <TextField
                  id={`reply-input-${comment.comment_idx}`}
                  fullWidth
                  variant="outlined"
                  placeholder="답글을 입력하세요"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  multiline
                  rows={1}
                  size="small"
                  aria-label="대댓글 입력"
                />
                <IconButton
                  onClick={handleEmojiButtonClick}
                  sx={{ marginLeft: "8px" }}
                  aria-label="이모티콘 선택"
                  ref={emojiButtonRef}
                >
                  <EmojiEmotionsIcon />
                </IconButton>
                <StyledSendButton
                  onClick={handleReplySubmit}
                  disabled={!replyContent.trim()}
                  aria-label="대댓글 전송"
                >
                  <SendIcon />
                </StyledSendButton>

                {/* 이모티콘 피커 위치 조정 및 크기 축소 */}
                <Popover
                  open={Boolean(emojiPopoverAnchor)}
                  anchorEl={emojiPopoverAnchor}
                  onClose={handleEmojiPopoverClose}
                  anchorOrigin={{
                    vertical: "top",
                    horizontal: "right",
                  }}
                  transformOrigin={{
                    vertical: "bottom",
                    horizontal: "left",
                  }}
                >
                  <Box sx={{ width: "250px", height: "300px" }}>
                    <Picker onEmojiClick={onEmojiClick} disableSearchBar />
                  </Box>
                </Popover>
              </Box>
              {/* 대댓글 목록 */}
              {comment.children && comment.children.length > 0 && (
                <Box sx={{ marginTop: 1 }}>
                  <AnimatePresence>
                    {comment.children.map((child) => (
                      <motion.div
                        key={child.comment_idx}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Comment
                          comment={child}
                          onEdit={onEdit}
                          onDelete={onDelete}
                          onReply={onReply}
                          depth={depth + 1} // depth 증가
                          replyingCommentId={replyingCommentId}
                          setReplyingCommentId={setReplyingCommentId}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </motion.div>
    </AnimatePresence>
  );
};

// ==================== 메인 컴포넌트 ====================
export default function Detail({ postId, onClose, onAddComment }) {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentContent, setCommentContent] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const [editComment, setEditComment] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const [replyingCommentId, setReplyingCommentId] = useState(null); // 현재 답글 입력 중인 댓글 ID
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const [showEmojiPicker, setShowEmojiPicker] = useState(false); // 추가된 상태 변수
  const emojiButtonRef = useRef(null);
  const [emojiPopoverAnchor, setEmojiPopoverAnchor] = useState(null);

  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const userIdx = user?.user_idx;

  const BASE_URL = process.env.NEXT_PUBLIC_LOCAL_API_BASE_URL || 'http://localhost:8080/api';

  // 인증 체크
  useEffect(() => {
    console.log('[Detail] Checking auth for postId:', postId);
    const initializeAuth = async () => {
      const cookieToken = getCookie("token");
      console.log('[Detail] Cookie token:', cookieToken);
      if (cookieToken && !token) {
        useAuthStore.getState().setToken(cookieToken);
        try {
          console.log('[Detail] Fetching user profile...');
          const response = await axios.get(`${BASE_URL}/users/profile`, {
            headers: { Authorization: `Bearer ${cookieToken}` },
          });
          if (response.data.success) {
            console.log('[Detail] User profile fetch success:', response.data.data);
            useAuthStore.getState().setUser(response.data.data);
          } else {
            console.log('[Detail] Profile fetch failed, redirecting...');
            router.push('/authentication/login');
          }
        } catch (error) {
          console.error("사용자 정보 가져오기 실패:", error);
          router.push('/authentication/login');
        }
      }
      if (!useAuthStore.getState().token) {
        console.log('[Detail] No token found, redirecting to login');
        router.push('/authentication/login');
      }
    };
    initializeAuth();
  }, [token, router, postId]);

  // 상세 게시물 조회
  useEffect(() => {
    if (postId && token && userIdx) {
      console.log('[Detail] Calling fetchPost for postId:', postId);
      fetchPost();
    }
  }, [postId, token, userIdx]);

  const fetchPost = async () => {
    setLoading(true);
    try {
      console.log('[Detail] fetchPost start...');
      const url = `${BASE_URL}/regular-meeting-board/boards/${postId}`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const fetchedPost = response.data;

      console.log('[Detail] Raw fetched post:', fetchedPost);

      // 이미지 분할
      if (fetchedPost.image && fetchedPost.image.image_url) {
        fetchedPost.images = fetchedPost.image.image_url
          .split(",")
          .map((url) => url.trim());
      } else {
        fetchedPost.images = [];
      }

      // 내가 좋아요 눌렀는지
      if (Array.isArray(fetchedPost.likes)) {
        const userLike = fetchedPost.likes.find(
          (lk) => String(lk.user_idx) === String(userIdx)
        );
        fetchedPost.favorites_idx = userLike ? userLike.likes_idx : null;
      } else {
        fetchedPost.favorites_idx = null;
      }

      // 계층적 댓글 구조 변환 (대댓글 최대 1단계)
      if (Array.isArray(fetchedPost.comments)) {
        const commentMap = {};
        fetchedPost.comments.forEach((cmt) => {
          cmt.children = [];
          commentMap[cmt.comment_idx] = cmt;
        });
        const topLevelComments = [];
        fetchedPost.comments.forEach((cmt) => {
          if (cmt.parent_id) {
            if (commentMap[cmt.parent_id] && commentMap[cmt.parent_id].depth < 1) {
              commentMap[cmt.parent_id].children.push(cmt);
            }
          } else {
            cmt.depth = 0; // 초기 depth 설정
            topLevelComments.push(cmt);
          }
        });
        // 설정된 depth에 따라 대댓글 depth 설정
        topLevelComments.forEach((cmt) => {
          cmt.children.forEach((child) => {
            child.depth = 1;
          });
        });
        fetchedPost.comments = topLevelComments;
      }

      console.log('[Detail] Processed post data:', fetchedPost);
      setPost(fetchedPost);
    } catch (error) {
      console.error("게시물 상세 조회 실패:", error);
      if (error.response && error.response.status === 404) {
        alert("게시물이 존재하지 않습니다.");
        onClose();
      } else {
        alert("게시물 상세 조회 실패");
      }
    } finally {
      setLoading(false);
    }
  };

  // 좋아요 토글
  const handleLikeToggle = async () => {
    if (!post || !token || !userIdx) return;
    console.log('[Detail] handleLikeToggle clicked, postId=', postId);
    try {
      const url = `${BASE_URL}/regular-meeting-board/boards/${postId}/likes`;
      const response = await axios.post(url, null, {
        params: { user_idx: String(userIdx) },
        headers: { Authorization: `Bearer ${token}` },
      });
      // null => 좋아요 취소, data => 좋아요 추가
      if (response.data) {
        console.log('[Detail] Like added:', response.data);
        const newLike = response.data;
        setPost((prev) => {
          if (!prev) return null;
          const oldLikes = Array.isArray(prev.likes) ? prev.likes : [];
          const updatedLikes = [...oldLikes, newLike];
          return {
            ...prev,
            favorites_idx: newLike.likes_idx,
            likes: updatedLikes,
          };
        });
      } else {
        // 좋아요 취소
        console.log('[Detail] Like removed');
        setPost((prev) => {
          if (!prev) return null;
          const oldLikes = Array.isArray(prev.likes) ? prev.likes : [];
          const updatedLikes = oldLikes.filter(
            (lk) => lk.likes_idx !== prev.favorites_idx
          );
          return {
            ...prev,
            favorites_idx: null,
            likes: updatedLikes,
          };
        });
      }
    } catch (error) {
      console.error("좋아요 토글 실패:", error);
      alert("좋아요 기능 오류");
    }
  };

  // 댓글 작성
  const handleSubmitComment = async () => {
    if (!commentContent.trim()) {
      setSnackbarMessage("댓글을 입력하세요.");
      setSnackbarOpen(true);
      return;
    }
    console.log('[Detail] handleSubmitComment content:', commentContent);
    setSubmittingComment(true);
    try {
      const url = `${BASE_URL}/regular-meeting-board/comments`;
      await axios.post(
        url,
        {
          user_idx: String(userIdx),
          board_idx: postId,
          comment_content: commentContent,
          parent_id: null,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSnackbarMessage("댓글이 추가되었습니다.");
      setSnackbarOpen(true);
      setCommentContent("");
      fetchPost(); // 상세 재조회
      onAddComment?.();
    } catch (error) {
      console.error("댓글 제출 실패:", error);
      setSnackbarMessage(
        `댓글 제출 실패: ${
          error.response?.data?.error || "알 수 없는 오류"
        }`
      );
      setSnackbarOpen(true);
    } finally {
      setSubmittingComment(false);
    }
  };

  // 댓글 수정 핸들러
  const handleEditComment = (comment) => {
    setEditComment(comment);
    setEditModalOpen(true);
  };

  // 댓글 삭제 핸들러
  const handleDeleteComment = async (comment) => {
    if (!confirm("정말 댓글을 삭제하시겠습니까?")) return;
    try {
      const url = `${BASE_URL}/regular-meeting-board/comments/${comment.comment_idx}`;
      await axios.delete(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSnackbarMessage("댓글이 삭제되었습니다.");
      setSnackbarOpen(true);
      fetchPost(); // 상세 재조회
      onAddComment?.();
    } catch (error) {
      console.error("댓글 삭제 실패:", error);
      setSnackbarMessage(
        `댓글 삭제 실패: ${
          error.response?.data?.error || "알 수 없는 오류"
        }`
      );
      setSnackbarOpen(true);
    }
  };

  // 대댓글 작성 핸들러
  const handleReply = async (parentComment, replyContent) => {
    if (!replyContent.trim()) {
      setSnackbarMessage("대댓글을 입력하세요.");
      setSnackbarOpen(true);
      return;
    }
    try {
      const url = `${BASE_URL}/regular-meeting-board/comments`;
      await axios.post(
        url,
        {
          user_idx: String(userIdx),
          board_idx: postId,
          comment_content: replyContent,
          parent_id: parentComment.comment_idx,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSnackbarMessage("대댓글이 추가되었습니다.");
      setSnackbarOpen(true);
      fetchPost(); // 상세 재조회
      onAddComment?.();
    } catch (error) {
      console.error("대댓글 제출 실패:", error);
      setSnackbarMessage(
        `대댓글 제출 실패: ${
          error.response?.data?.error || "알 수 없는 오류"
        }`
      );
      setSnackbarOpen(true);
    }
  };

  // === 이모티콘 선택 핸들러 (메인 댓글) ===
  const onMainEmojiClick = (emojiData) => {
    if (emojiData && emojiData.emoji) {
      setCommentContent((prev) => prev + emojiData.emoji);
    } else {
      console.error("선택된 이모티콘이 없습니다:", emojiData);
    }
    setEmojiPopoverAnchor(null);
  };

  // === 댓글/대댓글 재귀 렌더링 ===
  const renderComments = (commentList, depth = 0) => {
    if (!Array.isArray(commentList)) {
      console.error("댓글 데이터가 배열이 아닙니다:", commentList);
      return null;
    }

    return commentList.map((comment) => {
      if (!comment.comment_idx || typeof comment.comment_idx !== "number") {
        console.warn("유효하지 않은 comment_idx 값:", comment);
        return null;
      }

      // 대댓글은 depth가 1까지만 허용
      if (depth > 1) return null;

      return (
        <Comment
          key={comment.comment_idx}
          comment={comment}
          onEdit={handleEditComment}
          onDelete={handleDeleteComment}
          onReply={handleReply}
          depth={depth}
          replyingCommentId={replyingCommentId}
          setReplyingCommentId={setReplyingCommentId}
        />
      );
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", marginTop: "50px" }}>
        <CircularProgress />
      </Box>
    );
  }
  if (!post) return null;

  const likeCount = Array.isArray(post.likes) ? post.likes.length : 0;
  const commentCount = Array.isArray(post.comments)
    ? post.comments.reduce((acc, cmt) => acc + 1 + (cmt.children ? cmt.children.length : 0), 0)
    : 0;

  let bracketTitle = "";
  let pureContent = post.board_content || "";
  if (pureContent.startsWith("[")) {
    const idx = pureContent.indexOf("]");
    if (idx > 1) {
      bracketTitle = pureContent.slice(1, idx);
      pureContent = pureContent.slice(idx + 1).trim();
    }
  }

  const handleEmojiButtonClick = (event) => {
    setEmojiPopoverAnchor(event.currentTarget);
  };

  const handleEmojiPopoverClose = () => {
    setEmojiPopoverAnchor(null);
  };

  return (
    <Modal open={!!postId} onClose={onClose}>
      <Box
        sx={{
          display: "flex",
          bgcolor: "white",
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: { xs: "95%", md: "80%" },
          height: { xs: "90%", md: "80%" },
          borderRadius: "8px",
          overflow: "hidden",
          boxShadow: 24,
        }}
      >
        {/* 닫기 버튼 */}
        <IconButton
          onClick={onClose}
          sx={{ position: "absolute", top: "10px", right: "10px", zIndex: 10 }}
          aria-label="닫기"
        >
          <CloseIcon />
        </IconButton>

        {/* 왼쪽: 이미지 */}
        <Box sx={{ flex: 2, position: "relative", overflow: "hidden", height: "100%" }}>
          <Swiper
            modules={[Navigation, SwiperPagination]}
            navigation
            pagination={{ clickable: true }}
            style={{ width: "100%", height: "100%" }}
            onInit={(swiper) => {
              swiper.navigation.prevEl.addEventListener("click", (e) =>
                e.stopPropagation()
              );
              swiper.navigation.nextEl.addEventListener("click", (e) =>
                e.stopPropagation()
              );
            }}
          >
            {Array.isArray(post.images) && post.images.length > 0 ? (
              post.images.map((imgUrl, idx) => (
                <SwiperSlide key={idx}>
                  <img
                    src={`http://localhost:8080${imgUrl}`}
                    alt={`postImage-${idx}`}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => (e.target.src = "/images/default-post.jpg")}
                    onClick={(e) => e.stopPropagation()}
                  />
                </SwiperSlide>
              ))
            ) : (
              <SwiperSlide>
                <img
                  src="/images/default-post.jpg"
                  alt="Default"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onClick={(e) => e.stopPropagation()}
                />
              </SwiperSlide>
            )}
          </Swiper>
        </Box>

        {/* 오른쪽: 내용 + 댓글 */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            bgcolor: "white",
            overflowY: "auto",
            padding: "20px",
          }}
        >
          {/* 작성자 */}
          <Box sx={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
            <Avatar
              src={post.user?.avatar_url || "/images/default-avatar.jpg"}
              alt={post.user?.username || ""}
              sx={{ marginRight: "10px" }}
            />
            <Box>
              <Typography variant="subtitle2" fontWeight="bold">
                {post.user?.username || "익명"}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {new Date(post.uploaded_at).toLocaleDateString()}
              </Typography>
            </Box>
          </Box>

          {/* 좋아요/댓글 아이콘 + 카운트 */}
          <Box sx={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <IconButton onClick={handleLikeToggle} aria-label="좋아요">
                {post.favorites_idx ? (
                  <FavoriteIcon sx={{ color: "red" }} />
                ) : (
                  <FavoriteBorderIcon />
                )}
              </IconButton>
              <Typography variant="body2">좋아요 {likeCount}개</Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <ChatBubbleOutlineIcon sx={{ marginRight: "5px" }} />
              <Typography variant="body2">댓글 {commentCount}개</Typography>
            </Box>
          </Box>

          {/* 제목 + 내용 */}
          <Typography variant="h6" sx={{ fontWeight: "bold", marginTop: "10px" }}>
            {bracketTitle || "제목 없음"}
          </Typography>
          <Divider sx={{ marginY: "5px" }} />
          <Typography variant="body1" sx={{ marginBottom: "20px", whiteSpace: "pre-wrap" }}>
            {pureContent || "내용 없음"}
          </Typography>

          {/* 댓글 목록 */}
          <Box sx={{ flex: 1, overflowY: "auto" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: "bold", marginBottom: "10px" }}>
              댓글
            </Typography>
            {Array.isArray(post.comments) && post.comments.length > 0 ? (
              <AnimatePresence>
                {post.comments.map((cmt) => (
                  <motion.div
                    key={cmt.comment_idx}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Comment
                      comment={cmt}
                      onEdit={handleEditComment}
                      onDelete={handleDeleteComment}
                      onReply={handleReply}
                      depth={0} // 최상위 댓글의 depth는 0
                      replyingCommentId={replyingCommentId}
                      setReplyingCommentId={setReplyingCommentId}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            ) : (
              <Typography variant="body2" color="textSecondary">
                댓글이 없습니다.
              </Typography>
            )}
          </Box>

          {/* 댓글 작성 */}
          <Box sx={{ borderTop: "1px solid #ccc", paddingTop: "10px", marginTop: "auto", position: "relative" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Avatar
                src={user?.avatar_url || "/images/default-avatar.jpg"}
                alt={user?.username || "익명"}
                sx={{ width: 30, height: 30 }}
              />
              {/* 이모티콘 버튼 추가 */}
              <IconButton
                onClick={handleEmojiButtonClick}
                sx={{ marginLeft: "8px" }}
                aria-label="이모티콘 선택"
                ref={emojiButtonRef}
              >
                <EmojiEmotionsIcon />
              </IconButton>
              <TextField
                variant="outlined"
                placeholder="댓글을 입력하세요"
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                fullWidth
                multiline
                maxRows={4}
                aria-label="새 댓글 입력"
              />
              <IconButton onClick={handleSubmitComment} aria-label="댓글 제출">
                <SendIcon />
              </IconButton>
              {/* 이모티콘 피커 위치 조정 및 크기 축소 */}
              <Popover
                open={Boolean(emojiPopoverAnchor)}
                anchorEl={emojiPopoverAnchor}
                onClose={handleEmojiPopoverClose}
                anchorOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
                transformOrigin={{
                  vertical: "bottom",
                  horizontal: "left",
                }}
              >
                <Box sx={{ width: "250px", height: "300px" }}>
                  <Picker onEmojiClick={onMainEmojiClick} disableSearchBar />
                </Box>
              </Popover>
            </Box>
            {submittingComment && (
              <CircularProgress size={24} sx={{ marginTop: 1 }} />
            )}
          </Box>
        </Box>

        {/* 댓글 수정 모달 */}
        {editComment && (
          <EditCommentModal
            open={editModalOpen}
            comment={editComment}
            onClose={() => setEditModalOpen(false)}
            onSuccess={fetchPost}
          />
        )}

        {/* Snackbar 알림 */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={() => setSnackbarOpen(false)}
          message={snackbarMessage}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        />
      </Box>
    </Modal>
  );
}
