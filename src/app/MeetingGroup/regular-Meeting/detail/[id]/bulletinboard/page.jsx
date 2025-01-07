// src/app/MeetingGroup/regular-Meeting/detail/[id]/bulletinboard/page.jsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Card,
  IconButton,
  TextField,
  Button,
  Modal,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Collapse,
  CircularProgress,
  Tooltip,
  Menu as MuiMenu,
  MenuItem as MuiMenuItem, // MenuItem 임포트
} from '@mui/material';

import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import Link from 'next/link';
import axios from 'axios';

import styles from './BulletinBoard.module.css';
import Detail from './detail'; // 상세보기 모달

import useAuthStore from 'store/authStore';
import { useRouter, useParams } from 'next/navigation';
import { getCookie } from 'cookies-next';

// API 및 이미지 URL을 위한 BASE_URL 정의
const LOCAL_API_BASE_URL =
  process.env.NEXT_PUBLIC_LOCAL_API_BASE_URL || 'http://localhost:8080/api';
const IMAGE_BASE_URL =
  process.env.NEXT_PUBLIC_IMAGE_BASE_URL || 'http://localhost:8080/uploads';
const BASE_URL =
  process.env.NEXT_PUBLIC_LOCAL_API_BASE_URL || 'http://localhost:8080/api';

// ==================== 수정 모달 (기존 이미지 미리보기 X) ====================
function EditModal({ open, post, onClose, onSuccess }) {
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  // 새로 추가할 이미지들
  const [editImages, setEditImages] = useState([]);

  useEffect(() => {
    if (post) {
      if (post.board_content.startsWith('[')) {
        const endIdx = post.board_content.indexOf(']');
        if (endIdx > 1) {
          setEditTitle(post.board_content.slice(1, endIdx));
          setEditContent(post.board_content.slice(endIdx + 1).trim());
        } else {
          setEditTitle('');
          setEditContent(post.board_content);
        }
      } else {
        setEditTitle('');
        setEditContent(post.board_content);
      }
      // 기존 이미지 미리보기는 보여주지 않음
      setEditImages([]);
    }
  }, [post]);

  const handleNewImages = (e) => {
    const files = Array.from(e.target.files);
    setEditImages((prev) => [...prev, ...files]);
  };

  const handleSubmit = async () => {
    if (!editTitle.trim() || !editContent.trim()) {
      alert('제목/내용을 입력하세요.');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('board_idx', post.board_idx);
      formData.append('board_content', `[${editTitle}] ${editContent}`);

      // 새로 추가된 이미지(파일)만 전송
      editImages.forEach((file) => {
        formData.append('files', file);
      });

      const url = `${LOCAL_API_BASE_URL}/regular-meeting-board/boards/${post.board_idx}`;
      await axios.put(url, formData, {
        headers: {
          Authorization: `Bearer ${useAuthStore.getState().token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      alert('게시물이 수정되었습니다.');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('게시물 수정 실패:', error);
      alert(
        `게시물 수정 실패: ${
          error.response?.data?.message || '알 수 없는 오류'
        }`
      );
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          width: '80%',
          height: '80%',
          backgroundColor: 'white',
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          borderRadius: '10px',
          overflow: 'hidden',
          boxShadow: 24,
        }}
      >
        {/* 왼쪽: 새 이미지 미리보기 */}
        <Box
          sx={{
            flex: 2,
            position: 'relative',
            overflow: 'hidden',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: editImages.length === 0 ? '2px dashed #ccc' : 'none',
            backgroundColor: editImages.length === 0 ? '#f9f9f9' : 'transparent',
          }}
        >
          {editImages.length === 0 ? (
            <Typography
              sx={{
                textAlign: 'center',
                color: '#aaa',
                fontSize: '16px',
                fontWeight: 'bold',
              }}
            >
              + 이미지를 추가해주세요
            </Typography>
          ) : (
            <Swiper
              modules={[Navigation, Pagination]}
              navigation
              pagination={{ clickable: true }}
              style={{
                width: '100%',
                height: '100%',
              }}
              onInit={(swiper) => {
                swiper.navigation.prevEl.addEventListener('click', (e) =>
                  e.stopPropagation()
                );
                swiper.navigation.nextEl.addEventListener('click', (e) =>
                  e.stopPropagation()
                );
              }}
            >
              {editImages.map((file, idx) => (
                <SwiperSlide key={idx}>
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Selected ${idx}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          )}
          <Button
            variant="outlined"
            startIcon={<AddPhotoAlternateIcon />}
            sx={{
              position: 'absolute',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 10,
              backgroundColor: 'white',
              border: '1px solid #1976d2',
              color: '#1976d2',
              '&:hover': { backgroundColor: '#f5f5f5' },
            }}
            onClick={() => document.getElementById('editFileInput').click()}
          >
            이미지 추가
          </Button>
        </Box>

        {/* 오른쪽: 제목/내용 수정 */}
        <Box
          sx={{
            flex: 1,
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'white',
            overflowY: 'auto',
          }}
        >
          <TextField
            fullWidth
            placeholder="제목 입력"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            sx={{ marginBottom: '20px' }}
          />
          <TextField
            fullWidth
            multiline
            rows={6} // 수정 모달에서 내용 입력 높이
            placeholder="내용 입력"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            sx={{ marginBottom: '20px' }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            sx={{ marginTop: 'auto' }}
          >
            수정하기
          </Button>
        </Box>

        {/* 파일 input */}
        <input
          type="file"
          accept="image/*"
          id="editFileInput"
          style={{ display: 'none' }}
          multiple
          onChange={handleNewImages}
        />
      </Box>
    </Modal>
  );
}
// ==================== 수정 모달 끝 ====================

/** 
 * 상위 게시물 (스토리) 선별 함수
 * 최신 게시물 기준으로 정렬하여 상위 7개 선택
 */
const getLatestPosts = (posts, topN = 7) => {
  return [...posts]
    .sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at))
    .slice(0, topN);
};

// TopStories 컴포넌트 정의
const TopStories = ({ topPosts, onStoryClick }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        overflowX: 'auto',
        padding: '10px 0',
        marginBottom: '20px',
      }}
    >
      {topPosts.map((post) => (
        <Tooltip key={post.board_idx} title={post.user?.username || '익명'}>
          <Avatar
            src={
              post.images && post.images.length > 0
                ? `http://localhost:8080${post.images[0]}`
                : '/images/default-post.jpg'
            }
            alt={post.user?.username || '익명'}
            sx={{
              width: { xs: 50, sm: 60 },
              height: { xs: 50, sm: 60 },
              marginRight: 2,
              cursor: 'pointer',
              border: `2px solid #1976d2`,
              transition: 'transform 0.3s, border 0.3s',
              '&:hover': {
                transform: 'scale(1.1)',
                border: `2px solid #ff4081`,
              },
            }}
            onClick={() => onStoryClick(post)}
          />
        </Tooltip>
      ))}
    </Box>
  );
};

// ==================== 메인 컴포넌트 ====================
export default function BulletinBoardPage() {
  const params = useParams();
  const { id } = params || {};
  const meetingIdx = id;

  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const userIdx = user?.user_idx;

  // 로컬 상태
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // 작성 모달
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');

  // 검색 Drawer 내부 확장
  const [searchOpen, setSearchOpen] = useState(false); // 검색 항목 열기/닫기
  const [searchKeyword, setSearchKeyword] = useState('');

  // 드롭다운(수정/삭제) 메뉴
  const [anchorEls, setAnchorEls] = useState({});

  // Drawer (햄버거)
  const [drawerOpen, setDrawerOpen] = useState(false);

  // 상세보기 모달
  const [selectedPost, setSelectedPost] = useState(null);

  // 수정 모달
  const [editPost, setEditPost] = useState(null);
  const [editOpen, setEditOpen] = useState(false);

  // 인증 체크
  useEffect(() => {
    const initializeAuth = async () => {
      const cookieToken = getCookie('token');
      if (cookieToken && !token) {
        useAuthStore.getState().setToken(cookieToken);
        try {
          const response = await axios.get(`${BASE_URL}/users/profile`, {
            headers: { Authorization: `Bearer ${cookieToken}` },
          });
          if (response.data.success) {
            useAuthStore.getState().setUser(response.data.data);
          } else {
            router.push('/authentication/login');
          }
        } catch (error) {
          console.error('사용자 정보 가져오기 실패:', error);
          router.push('/authentication/login');
        }
      }
      // 토큰 없으면 로그인 페이지로
      if (!useAuthStore.getState().token) {
        router.push('/authentication/login');
      }
    };
    initializeAuth();
  }, [token, router]);

  // 게시물 목록 불러오기
  useEffect(() => {
    if (token && userIdx && meetingIdx) {
      fetchPosts();
    }
  }, [token, userIdx, meetingIdx]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const url = `${LOCAL_API_BASE_URL}/regular-meeting-board/meetings/${meetingIdx}/boards`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const boardData = response.data || [];

      const processedData = boardData.map((post) => {
        // 이미지 문자열 -> 배열
        if (post.image && post.image.image_url) {
          post.images = post.image.image_url.split(',').map((u) => u.trim());
        } else {
          post.images = [];
        }

        // 내가 좋아요 눌렀는지
        if (Array.isArray(post.likes)) {
          const userLike = post.likes.find(
            (like) => String(like.user_idx) === String(userIdx)
          );
          post.favorites_idx = userLike ? userLike.likes_idx : null;
        } else {
          post.favorites_idx = null;
        }
        return post;
      });

      setPosts(processedData);
      setFilteredPosts(processedData);
    } catch (error) {
      console.error('게시물 목록 불러오기 실패:', error);
      alert('게시물 목록 불러오기 실패');
    } finally {
      setLoading(false);
    }
  };

  // 검색 로직
  useEffect(() => {
    let filtered = [...posts];
    if (searchKeyword.trim()) {
      const key = searchKeyword.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          (p.board_content && p.board_content.toLowerCase().includes(key)) ||
          (p.user &&
            p.user.username &&
            p.user.username.toLowerCase().includes(key))
      );
    }
    setFilteredPosts(filtered);
  }, [searchKeyword, posts]);

  // 좋아요 토글
  const handleLikeToggle = async (boardIdx) => {
    try {
      const url = `${LOCAL_API_BASE_URL}/regular-meeting-board/boards/${boardIdx}/likes`;
      const response = await axios.post(url, null, {
        params: { user_idx: String(userIdx) },
        headers: { Authorization: `Bearer ${token}` },
      });
      // null => 좋아요 취소, data => 좋아요 추가
      if (response.data) {
        const newLike = response.data;
        setPosts((prev) =>
          prev.map((post) => {
            if (post.board_idx === boardIdx) {
              const oldLikes = Array.isArray(post.likes) ? post.likes : [];
              const updatedLikes = [...oldLikes, newLike];
              return {
                ...post,
                favorites_idx: newLike.likes_idx,
                likes: updatedLikes,
              };
            }
            return post;
          })
        );
      } else {
        // 좋아요 취소
        setPosts((prev) =>
          prev.map((post) => {
            if (post.board_idx === boardIdx) {
              const oldLikes = Array.isArray(post.likes) ? post.likes : [];
              const updatedLikes = oldLikes.filter(
                (lk) => lk.likes_idx !== post.favorites_idx
              );
              return {
                ...post,
                favorites_idx: null,
                likes: updatedLikes,
              };
            }
            return post;
          })
        );
      }
    } catch (error) {
      console.error('좋아요 토글 실패:', error);
      alert('좋아요 기능 오류');
    }
  };

  // 게시물 작성
  const handleNewPost = async () => {
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      alert('제목/내용을 입력하세요.');
      return;
    }
    if (selectedImages.length === 0) {
      alert('이미지를 선택해주세요.');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('meeting_idx', meetingIdx.toString());
      formData.append('user_idx', String(userIdx));
      formData.append('board_content', `[${newPostTitle}] ${newPostContent}`);
      selectedImages.forEach((file) => formData.append('files', file));

      const url = `${LOCAL_API_BASE_URL}/regular-meeting-board/boards`;
      await axios.post(url, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      alert('게시물이 생성되었습니다.');
      setPostModalOpen(false);
      setSelectedImages([]);
      setNewPostTitle('');
      setNewPostContent('');
      fetchPosts();
    } catch (error) {
      console.error('게시물 생성 실패:', error);
      alert(
        `게시물 생성 실패: ${
          error.response?.data?.message || '알 수 없는 오류'
        }`
      );
    }
  };

  // 게시물 삭제
  const handleDeletePost = async (boardIdx) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      const url = `${LOCAL_API_BASE_URL}/regular-meeting-board/boards/${boardIdx}`;
      await axios.delete(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('게시물이 삭제되었습니다.');
      setSelectedPost(null);
      fetchPosts();
    } catch (error) {
      console.error('게시물 삭제 실패:', error);
      alert('게시물 삭제 실패');
    }
  };

  // 수정 모달
  const handleEditOpen = (post) => {
    setEditPost(post);
    setEditOpen(true);
  };
  const handleEditClose = () => {
    setEditOpen(false);
    setEditPost(null);
  };

  // 파일 업로드 (게시물 생성)
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedImages((prev) => [...prev, ...files]);
  };

  // Drawer 토글
  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  // 상세보기 열기
  const handleCardClick = (post) => {
    setSelectedPost(post);
  };
  const handleCloseDetail = () => {
    setSelectedPost(null);
  };

  // 수정/삭제 드롭다운 메뉴
  const handleMoreClick = (event, boardIdx) => {
    event.stopPropagation();
    setAnchorEls((prev) => ({ ...prev, [boardIdx]: event.currentTarget }));
  };
  const handleMoreClose = (boardIdx) => {
    setAnchorEls((prev) => ({ ...prev, [boardIdx]: null }));
  };

  // 본문 더보기
  const handleExpandToggle = (post) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.board_idx === post.board_idx ? { ...p, expanded: !p.expanded } : p
      )
    );
  };

  // 검색 누르면 Drawer 내부에서 확장
  const handleSearchToggle = () => {
    setSearchOpen((prev) => !prev);
  };

  return (
    <Box sx={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      {/* 햄버거 */}
      <IconButton
        onClick={handleDrawerToggle}
        sx={{
          position: 'fixed',
          bottom: '80px',
          right: '16px',
          backgroundColor: '#28a745',
          color: 'white',
          zIndex: 10,
          '&:hover': { backgroundColor: '#218838' },
        }}
      >
        <MenuIcon />
      </IconButton>

      {/* 게시물 작성 버튼 */}
      <IconButton
        onClick={() => setPostModalOpen(true)}
        sx={{
          position: 'fixed',
          bottom: '20px',
          right: '16px',
          backgroundColor: '#4caf50',
          color: 'white',
          zIndex: 10,
          '&:hover': { backgroundColor: '#388e3c' },
        }}
      >
        <AddCircleIcon />
      </IconButton>

      {/* 상단 스토리 */}
      <TopStories
        topPosts={getLatestPosts(posts, 7)} // 7개로 변경
        onStoryClick={handleCardClick}
      />

      {/* 로딩 또는 게시물 목록 */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
          <CircularProgress />
        </Box>
      ) : (
        filteredPosts.map((post) => {
          let bracketTitle = '';
          let pureContent = post.board_content || '';
          if (pureContent.startsWith('[')) {
            const idx = pureContent.indexOf(']');
            if (idx > 1) {
              bracketTitle = pureContent.slice(1, idx);
              pureContent = pureContent.slice(idx + 1).trim();
            }
          }

          const likeCount = Array.isArray(post.likes) ? post.likes.length : 0;

          return (
            <Card
              key={post.board_idx}
              sx={{ marginBottom: '20px', borderRadius: '8px', position: 'relative' }}
              className={styles.postCard}
              onClick={() => handleCardClick(post)}
            >
              {/* 수정/삭제 아이콘 */}
              <IconButton
                sx={{ position: 'absolute', top: '5px', right: '5px' }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleMoreClick(e, post.board_idx);
                }}
              >
                <MoreVertIcon />
              </IconButton>
              {/* 펼쳐지는 메뉴 */}
              <MuiMenu
                anchorEl={anchorEls[post.board_idx] || null}
                open={Boolean(anchorEls[post.board_idx])}
                onClose={() => handleMoreClose(post.board_idx)}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                <MuiMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMoreClose(post.board_idx);
                    handleEditOpen(post);
                  }}
                >
                  수정
                </MuiMenuItem>
                <MuiMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMoreClose(post.board_idx);
                    handleDeletePost(post.board_idx);
                  }}
                >
                  삭제
                </MuiMenuItem>
              </MuiMenu>

              {/* 작성자 */}
              <Box sx={{ display: 'flex', alignItems: 'center', padding: '10px' }}>
                <Avatar
                  src={post.user?.avatar_url || '/images/default-avatar.jpg'}
                  alt={post.user?.username || ''}
                  sx={{ marginRight: '10px' }}
                />
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold">
                    {post.user?.username || '익명'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {new Date(post.uploaded_at).toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>

              {/* 이미지 슬라이더 */}
              <Swiper
                modules={[Navigation, Pagination]}
                navigation
                pagination={{ clickable: true }}
                style={{ width: '100%', height: '400px' }}
                onInit={(swiper) => {
                  swiper.navigation.prevEl.addEventListener('click', (e) =>
                    e.stopPropagation()
                  );
                  swiper.navigation.nextEl.addEventListener('click', (e) =>
                    e.stopPropagation()
                  );
                }}
              >
                {Array.isArray(post.images) && post.images.length > 0 ? (
                  post.images.map((imgUrl, idx) => (
                    <SwiperSlide key={idx}>
                      <img
                        src={`http://localhost:8080${imgUrl}`}
                        alt={`img-${idx}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        loading="lazy"
                        onError={(e) => {
                          e.target.src = '/images/default-post.jpg';
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </SwiperSlide>
                  ))
                ) : (
                  <SwiperSlide>
                    <img
                      src="/images/default-post.jpg"
                      alt="Default"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </SwiperSlide>
                )}
              </Swiper>

              {/* 좋아요/댓글 아이콘 + "좋아요 n개" */}
              <Box sx={{ padding: '0 10px', marginTop: '8px' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {/* 좋아요 아이콘 */}
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLikeToggle(post.board_idx);
                    }}
                  >
                    {post.favorites_idx ? (
                      <FavoriteIcon sx={{ color: 'red' }} />
                    ) : (
                      <FavoriteBorderIcon />
                    )}
                  </IconButton>

                  {/* 댓글 아이콘 */}
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCardClick(post);
                    }}
                  >
                    <ChatBubbleOutlineIcon />
                  </IconButton>
                </Box>

                {/* 좋아요 개수 */}
                <Typography variant="body2" sx={{ marginLeft: '10px', marginTop: '5px' }}>
                  좋아요 {likeCount}개
                </Typography>
              </Box>

              {/* 본문 내용 */}
              <Box sx={{ padding: '10px' }}>
                <Typography
                  variant="body2"
                  sx={{
                    marginTop: '10px',
                    fontWeight: 'bold',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={bracketTitle}
                >
                  {bracketTitle || '제목 없음'}
                </Typography>

                <Collapse in={post.expanded} timeout="auto" unmountOnExit>
                  <Typography variant="body2" color="textSecondary" sx={{ marginTop: '5px' }}>
                    {pureContent || '내용 없음'}
                  </Typography>
                </Collapse>
                <Button
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExpandToggle(post);
                  }}
                  sx={{ textTransform: 'none', marginTop: '5px' }}
                >
                  {post.expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />} 더보기
                </Button>
              </Box>
            </Card>
          );
        })
      )}

      {/* 게시물 작성 모달 */}
      <Modal open={postModalOpen} onClose={() => setPostModalOpen(false)}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            width: '80%',
            height: '80%',
            backgroundColor: 'white',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            borderRadius: '10px',
            overflow: 'hidden',
            boxShadow: 24,
          }}
        >
          {/* 왼쪽: 이미지 미리보기 */}
          <Box
            sx={{
              flex: 2,
              position: 'relative',
              overflow: 'hidden',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: selectedImages.length === 0 ? '2px dashed #ccc' : 'none',
              backgroundColor: selectedImages.length === 0 ? '#f9f9f9' : 'transparent',
            }}
          >
            {selectedImages.length === 0 ? (
              <Typography
                sx={{
                  textAlign: 'center',
                  color: '#aaa',
                  fontSize: '16px',
                  fontWeight: 'bold',
                }}
              >
                + 사진을 추가해주세요
              </Typography>
            ) : (
              <Swiper
                modules={[Navigation, Pagination]}
                navigation
                pagination={{ clickable: true }}
                style={{
                  width: '100%',
                  height: '100%',
                }}
                onInit={(swiper) => {
                  swiper.navigation.prevEl.addEventListener('click', (e) =>
                    e.stopPropagation()
                  );
                  swiper.navigation.nextEl.addEventListener('click', (e) =>
                    e.stopPropagation()
                  );
                }}
              >
                {selectedImages.map((file, idx) => (
                  <SwiperSlide key={idx}>
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Selected ${idx}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </SwiperSlide>
                ))}
              </Swiper>
            )}
            <Button
              variant="outlined"
              startIcon={<AddPhotoAlternateIcon />}
              sx={{
                position: 'absolute',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 10,
                backgroundColor: 'white',
                border: '1px solid #1976d2',
                color: '#1976d2',
                '&:hover': { backgroundColor: '#f5f5f5' },
              }}
              onClick={() => document.getElementById('fileInput').click()}
            >
              사진 추가
            </Button>
          </Box>

          {/* 오른쪽: 작성 폼 */}
          <Box
            sx={{
              flex: 1,
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'white',
              overflowY: 'auto',
            }}
          >
            <TextField
              fullWidth
              placeholder="제목 입력"
              value={newPostTitle}
              onChange={(e) => setNewPostTitle(e.target.value)}
              sx={{ marginBottom: '20px' }}
            />
            <TextField
              fullWidth
              multiline
              rows={8} // 게시물 작성 시 내용 높이
              placeholder="내용 입력"
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              sx={{ marginBottom: '20px' }}
            />
            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={handleNewPost}
              sx={{ marginTop: 'auto' }}
            >
              게시물 생성
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* 파일 input (게시물 생성) */}
      <input
        type="file"
        accept="image/*"
        id="fileInput"
        style={{ display: 'none' }}
        multiple
        onChange={handleFileChange}
      />

      {/* 수정 모달 */}
      <EditModal
        open={editOpen}
        post={editPost}
        onClose={handleEditClose}
        onSuccess={fetchPosts}
      />

      {/* 상세보기 모달 */}
      {selectedPost && (
        <Detail
          postId={selectedPost.board_idx}
          onClose={handleCloseDetail}
          onAddComment={fetchPosts}
        />
      )}

      {/* Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        PaperProps={{
          sx: {
            position: 'absolute',
            top: '25vh',
            height: '40vh',
            width: '300px',
            margin: '0 auto',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '16px',
            backdropFilter: 'blur(10px)',
          },
        }}
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* 닫기 버튼 */}
          <IconButton
            onClick={handleDrawerToggle}
            sx={{
              alignSelf: 'flex-end',
              margin: 1,
            }}
          >
            <CloseIcon />
          </IconButton>

          <List sx={{ padding: 0, margin: 0 }}>
            {/* 홈 */}
            <ListItemButton
              onClick={() => {
                router.push('/');
                handleDrawerToggle();
              }}
              sx={{
                textAlign: 'center',
                '&:hover': { backgroundColor: '#dff0d8' },
              }}
            >
              <ListItemText
                primary="홈"
                sx={{
                  textAlign: 'center',
                  fontWeight: 'bold',
                  color: '#333',
                }}
              />
            </ListItemButton>

            {/* 게시판 */}
            <ListItemButton
              onClick={() => {
                router.push(`/MeetingGroup/regular-Meeting/detail/${meetingIdx}/bulletinboard`);
                handleDrawerToggle();
              }}
              sx={{
                textAlign: 'center',
                '&:hover': { backgroundColor: '#dff0d8' },
              }}
            >
              <ListItemText
                primary="게시판"
                sx={{
                  textAlign: 'center',
                  fontWeight: 'bold',
                  color: '#333',
                }}
              />
            </ListItemButton>

            {/* 사진첩 */}
            <ListItemButton
              onClick={() => {
                router.push('/photogallery');
                handleDrawerToggle();
              }}
              sx={{
                textAlign: 'center',
                '&:hover': { backgroundColor: '#dff0d8' },
              }}
            >
              <ListItemText
                primary="사진첩"
                sx={{
                  textAlign: 'center',
                  fontWeight: 'bold',
                  color: '#333',
                }}
              />
            </ListItemButton>

            {/* 채팅 */}
            <ListItemButton
              onClick={() => {
                router.push('/chat');
                handleDrawerToggle();
              }}
              sx={{
                textAlign: 'center',
                '&:hover': { backgroundColor: '#dff0d8' },
              }}
            >
              <ListItemText
                primary="채팅"
                sx={{
                  textAlign: 'center',
                  fontWeight: 'bold',
                  color: '#333',
                }}
              />
            </ListItemButton>

            {/* 검색 */}
            <ListItemButton
              onClick={() => {
                setSearchOpen((prev) => !prev);
              }}
              sx={{
                textAlign: 'center',
                '&:hover': { backgroundColor: '#dff0d8' },
              }}
            >
              <ListItemText
                primary="검색"
                sx={{
                  textAlign: 'center',
                  fontWeight: 'bold',
                  color: '#333',
                }}
              />
            </ListItemButton>

            {/* 검색창 */}
            <Collapse in={searchOpen} unmountOnExit>
              <Box sx={{ padding: '10px 16px' }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="검색어를 입력하세요"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  sx={{ marginTop: '8px' }}
                />
              </Box>
            </Collapse>
          </List>
        </Box>
      </Drawer>
    </Box>
  );
}
// ==================== 메인 컴포넌트 끝 ====================
