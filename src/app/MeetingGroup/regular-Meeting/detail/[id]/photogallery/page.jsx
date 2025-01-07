'use client';

import React, { useState, useEffect } from "react";
import {
  Grid,
  Card,
  CardMedia,
  Typography,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Dialog,
  DialogContent,
  CircularProgress,
  Badge,
  Snackbar,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import MuiAlert from '@mui/material/Alert';
import Link from 'next/link'; // Next.js Link 컴포넌트

import axios from "axios";

// Swiper imports
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import "../../../../../globals.css";

import useAuthStore from 'store/authStore'; // Zustand 스토어 import
import { getCookie } from 'cookies-next'; // 쿠키에서 값 가져오는 함수
import { useRouter, useParams } from 'next/navigation'; // Next.js 라우터 import

// Alert 컴포넌트 설정
const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export default function PhotoGallery() {
  const [photos, setPhotos] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [currentPhoto, setCurrentPhoto] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0); // 슬라이드 쇼용 인덱스
  const [loading, setLoading] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const router = useRouter();
  const params = useParams();
  const { id } = params || {}; // URL에서 'id' 파라미터 추출
  const meetingIdx = id; // 동적으로 meetingIdx 설정

  // Zustand 스토어에서 사용자 정보 및 토큰 가져오기
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const userIdx = user?.user_idx;

  // 인증 로직 통합
  useEffect(() => {
    const initializeAuth = async () => {
      const cookieToken = getCookie("token");
      if (cookieToken && !token) {
        useAuthStore.getState().setToken(cookieToken);
        try {
          const response = await axios.get(`${process.env.NEXT_PUBLIC_LOCAL_API_BASE_URL}/users/profile`, {
            headers: { Authorization: `Bearer ${cookieToken}` },
          });
          if (response.data.success) {
            useAuthStore.getState().setUser(response.data.data);
          } else {
            router.push('/authentication/login');
          }
        } catch (error) {
          console.error("사용자 정보 가져오기 실패:", error);
          router.push('/authentication/login');
        }
      }

      if (!useAuthStore.getState().token) {
        router.push('/authentication/login');
      }
    };

    initializeAuth();
  }, [token, router]);

  // 인증이 완료된 후 사진첩 데이터 불러오기
  useEffect(() => {
    const fetchPhotos = async () => {
      setLoading(true);
      try {
        const baseUrl = process.env.NEXT_PUBLIC_LOCAL_API_BASE_URL || "http://localhost:8080/api";
        const url = `${baseUrl}/regular-meeting-board/meetings/${meetingIdx}/boards`;
        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const boardData = response.data || [];

        console.log("API Response:", boardData); // 디버깅용 로그

        // 모든 게시물의 이미지를 추출하여 하나의 배열로 합침
        const allImages = [];
        boardData.forEach((post) => {
          if (post.image && post.image.image_url) { // 'post.image' 존재 확인
            const urls = post.image.image_url.split(','); // 쉼표로 분리
            urls.forEach((url, index) => {
              const trimmedUrl = url.trim();
              if (trimmedUrl) {
                const fullImageUrl = `${process.env.NEXT_PUBLIC_LOCAL_API_BASE_URL.replace('/api', '')}${trimmedUrl}`; // 예: http://localhost:8080/upload/UUID_filename.jpg
                allImages.push({
                  id: `${post.board_idx}-${post.image.image_idx}-${index}`, // 고유한 id 생성 (인덱스 추가)
                  image: fullImageUrl,
                  alt: `게시물 ${post.board_idx} 이미지 ${index + 1}`,
                  uploaded_at: post.uploaded_at, // 업로드 날짜
                  uploaderName: post.user?.username || '익명', // 업로더 이름
                });
              }
            });
          }
        });

        console.log("Extracted Images:", allImages); // 디버깅용 로그

        setPhotos(allImages);
      } catch (error) {
        console.error("사진첩 불러오기 실패:", error);
        alert("사진첩을 불러오는 데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    if (token && userIdx && meetingIdx) { // 인증이 완료된 후에만 데이터 fetching
      fetchPhotos();
    }
  }, [token, userIdx, meetingIdx]);

  // Drawer 토글 함수
  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  // 사진 클릭 시 다이얼로그 열기 및 인덱스 설정
  const handleClickOpen = (photo) => {
    const index = photos.findIndex(p => p.id === photo.id);
    setCurrentIndex(index !== -1 ? index : 0);
    setOpen(true);
  };

  // 다이얼로그 닫기
  const handleClose = () => {
    setOpen(false);
    setCurrentPhoto(null);
  };

  // 다운로드 핸들러 함수
  const handleDownload = async (imageUrl) => {
    try {
      const response = await fetch(imageUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/octet-stream',
          'Authorization': `Bearer ${token}`, // 필요 시 인증 헤더 추가
        },
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', imageUrl.split('/').pop()); // 파일 이름 설정
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      showSnackbar('사진이 성공적으로 다운로드되었습니다!', 'success');
    } catch (error) {
      console.error("사진 다운로드 실패:", error);
      showSnackbar('사진을 다운로드하는 데 실패했습니다.', 'error');
    }
  };

  // 알림 표시 함수
  const showSnackbar = (message, severity = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // Snackbar 닫기 핸들러
  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };

  return (
    <Box
      sx={{
        padding: "20px",
        maxWidth: "900px", // 원래 크기로 설정
        margin: "0 auto",
        textAlign: "center",
        backgroundColor: '#e8f5e9', // 단색 연한 연두색 배경
        borderRadius: '16px',
        boxShadow: 3,
        minHeight: '100vh',
      }}
    >
      {/* 네비게이션 리스트 아이콘 */}
      <IconButton
        onClick={handleDrawerToggle}
        sx={{
          position: "fixed",
          bottom: "26px",
          right: "26px",
          backgroundColor: "#28a745",
          color: "white",
          boxShadow: 3,
          "&:hover": { backgroundColor: "#218838" },
        }}
      >
        <MenuIcon />
      </IconButton>

      {/* 제목 및 배지 */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mb: 4,
          flexDirection: { xs: 'column', sm: 'row' }, // 반응형 레이아웃
          gap: 2,
        }}
      >
        {/* 제목과 배지를 겹치게 배치 */}
        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
          <PhotoLibraryIcon fontSize="large" color="primary" />
          <Badge
            badgeContent={photos.length}
            color="secondary"
            sx={{
              position: 'absolute',
              top: -8,
              right: -8,
              '& .MuiBadge-badge': {
                border: `2px solid white`,
                padding: '0 4px',
              },
            }}
          />
        </Box>
        <Typography
          variant="h4"
          sx={{
            fontWeight: "bold",
            color: "#2e7d32",
          }}
        >
          사진첩
        </Typography>
      </Box>

      {/* 로딩 표시 */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", marginTop: "50px" }}>
          <CircularProgress />
        </Box>
      ) : (
        // 사진첩 - 한 줄에 3장씩 표시
        <Grid container spacing={2}>
          {photos.length > 0 ? (
            photos.map((photo) => (
              <Grid item xs={6} sm={4} key={photo.id}> {/* sm=4으로 설정하여 한 줄에 3장씩 표시 */}
                <Card
                  sx={{
                    boxShadow: 2,
                    borderRadius: "8px",
                    overflow: "hidden",
                    "&:hover": { transform: "scale(1.03)", transition: "0.3s" },
                    cursor: "pointer",
                    position: 'relative',
                  }}
                  onClick={() => handleClickOpen(photo)} // 클릭 이벤트
                >
                  {/* 다운로드 버튼 */}
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation(); // 카드 클릭 이벤트 방지
                      handleDownload(photo.image);
                    }}
                    aria-label="사진 다운로드"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      backgroundColor: 'rgba(255,255,255,0.7)',
                      '&:hover': { backgroundColor: 'rgba(255,255,255,1)' },
                    }}
                  >
                    <DownloadIcon />
                  </IconButton>

                  <CardMedia
                    component="img"
                    height="180" // 이미지 높이를 원래대로 유지
                    image={photo.image}
                    alt={photo.alt}
                    loading="lazy" // Lazy Loading 적용
                    sx={{
                      objectFit: 'cover', // 이미지 크기 유지
                    }}
                    onError={(e) => {
                      e.target.onerror = null; // 무한 루프 방지
                      e.target.src = "/images/default-post.jpg"; // 기본 이미지 설정
                    }}
                  />

                  {/* 업로드 날짜 및 업로더 이름 표시 */}
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 8,
                      left: 8,
                      color: 'white',
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      padding: '4px 8px',
                      borderRadius: '4px',
                    }}
                  >
                    <Typography variant="body2">
                      {new Date(photo.uploaded_at).toLocaleDateString()}
                    </Typography>
                    <Typography variant="body2">
                      {photo.uploaderName}
                    </Typography>
                  </Box>
                </Card>
              </Grid>
            ))
          ) : (
            <Typography variant="body1">사진이 없습니다.</Typography>
          )}
        </Grid>
      )}

      {/* Modal/Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
        <DialogContent
          sx={{
            position: "relative",
            padding: 0,
            backgroundColor: "black",
          }}
        >
          {/* 닫기 버튼 */}
          <IconButton
            onClick={handleClose}
            sx={{
              position: "absolute",
              top: "8px",
              right: "8px",
              color: "white",
              zIndex: 2, // zIndex를 높게 설정하여 이미지 위에 표시되도록 함
            }}
          >
            <CloseIcon />
          </IconButton>

          {/* 슬라이드 쇼 */}
          <Swiper
            initialSlide={currentIndex}
            modules={[Navigation, Pagination]}
            navigation
            pagination={{ clickable: true }}
            style={{
              width: '100%',
              height: '80vh',
            }}
            onSlideChange={(swiper) => setCurrentIndex(swiper.activeIndex)}
          >
            {photos.map((photo) => (
              <SwiperSlide key={photo.id}>
                <img
                  src={photo.image}
                  alt={photo.alt}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/images/default-post.jpg";
                  }}
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </DialogContent>
      </Dialog>

      {/* Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        PaperProps={{
          sx: {
            position: "absolute",
            top: "25vh",
            height: "40vh",
            width: "300px",
            margin: "0 auto",
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            borderRadius: "16px",
            backdropFilter: "blur(10px)",
          },
        }}
      >
        <Box
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* 닫기 버튼 */}
          <IconButton
            onClick={handleDrawerToggle}
            sx={{ display: "flex", justifyContent: "flex-end", margin: 1 }}
          >
            <CloseIcon />
          </IconButton>

          {/* 네비게이션 리스트 */}
          <List>
            {[
              { label: "홈", href: "/MeetingGroup/regular-Meeting" },
              { label: "게시판", href: `/MeetingGroup/regular-Meeting/detail/${meetingIdx}/bulletinboard` },
              { label: "사진첩", href: `/MeetingGroup/regular-Meeting/detail/${meetingIdx}/photogallery` },
              { label: "채팅", href: `/MeetingGroup/regular-Meeting/detail/${meetingIdx}/chat` },
            ].map((item) => (
              <ListItem disablePadding key={item.label}>
                <Link href={item.href} passHref legacyBehavior>
                  <ListItemButton component="a" onClick={handleDrawerToggle}>
                    <ListItemText
                      primary={item.label}
                      sx={{
                        textAlign: "center",
                        fontWeight: "bold",
                        color: "#333",
                      }}
                    />
                  </ListItemButton>
                </Link>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Snackbar 알림 */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} // 가운데 아래로 위치 설정
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
