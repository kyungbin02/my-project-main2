'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
  Box,
  Typography,
  Avatar,
  Button,
  Grid,
  Card,
  CardMedia,
  CardContent,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  Modal,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import axiosInstance from '../../../../utils/axiosInstance'; // axios 인스턴스 import
import useAuthStore from 'store/authStore';
import { getCookie } from "cookies-next";

export default function MeetPage() {
  const BASE_URL = process.env.NEXT_PUBLIC_LOCAL_API_BASE_URL || "http://localhost:8080/api";
  const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_BASE_URL || "http://localhost:8080/uploads";

  const router = useRouter();
  const params = useParams();
  const meetingId = params.id || "";
  const token = useAuthStore((state) => state.token);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [meeting, setMeeting] = useState(null);
  const [members, setMembers] = useState([]);
  const [recentPhotos, setRecentPhotos] = useState([]);
  const [posts, setPosts] = useState([]);
  const [open, setOpen] = useState(false);
  const [greeting, setGreeting] = useState("");

  const [userIdx, setUserIdx] = useState(null);
  const [userName, setUserName] = useState("");

  // 기존 상태 변수들 아래에 추가
  //const [isMember, setIsMember] = useState(false);


  // 전체 멤버를 표시하는 모달 상태
  const [modalOpen, setModalOpen] = useState(false);
  // 수정하기 모달 
  const [editModalOpen, setEditModalOpen] = useState(false);
  // 수정용 필드들
  const [editName, setEditName] = useState("");
  // 실제 업로드할 파일
  const [editSelectedFile, setEditSelectedFile] = useState(null);
  // 미리보기용 이미지 경로
  const [editPreviewImage, setEditPreviewImage] = useState(null);
  const [editDescription, setEditDescription] = useState("");
  const [editRegion, setEditRegion] = useState("");
  const [editSubregion, setEditSubregion] = useState("");
  const [editPersonnel, setEditPersonnel] = useState(0)

  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = Boolean(anchorEl);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const openModal = () => {
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
  };

  const fetchMeetingDetails = async () => {
    try {
      const response = await axiosInstance.get(`/regular-meetings/detail/${meetingId}`, {
        params: { user_idx: userIdx },
      });
      console.log("모임 상세 정보 응답:", response.data);
      if (response.data) {
        setMeeting(response.data);
      } else {
        console.error("모임 상세 정보 요청 실패:", response.data);
        alert("모임 상세 정보를 불러오는 데 실패했습니다.");
        router.push('/MeetingGroup/regular-Meeting');
      }
    } catch (error) {
      console.error("모임 상세 정보 가져오기 실패:", error);
      alert("모임 상세 정보를 불러오는 데 실패했습니다.");
      router.push('/MeetingGroup/regular-Meeting');
    }
  };

  // 사용자 정보 받기
  useEffect(() => {
    const token = getCookie("token");
    if (token) {
      getUserIdx(token);
    }
  }, []);

  // useEffect(() => {
  //   if (Array.isArray(members) && members.length > 0 && userIdx) {
  //     const memberExists = members.some(member => Number(member.user_idx) === Number(userIdx));
  //     setIsMember(memberExists);
  //     console.log(`isMember set to: ${memberExists}`); // 디버깅용 로그
  //   }
  // }, [members, userIdx]);


  const getUserIdx = async (token) => {
    try {
      const API_URL = `${BASE_URL}/users/profile`;
      console.log("유저 정보 요청 URL:", API_URL);

      const response = await axiosInstance.get(`/users/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("유저 정보 응답 데이터:", response.data);

      if (response.data.success) {
        const fetchedUserIdx = response.data.data.user_idx;
        const fetchedUserName = response.data.data.username;
        setUserName(fetchedUserName);
        setUserIdx(fetchedUserIdx);
        useAuthStore.getState().setToken(token);
        console.log("user_idx:", fetchedUserIdx, "userName:", fetchedUserName);
      } else {
        console.error("유저 정보 요청 실패:", response.data.message);
        router.push('/authentication/login');
      }
    } catch (error) {
      console.error("유저 정보 가져오기 실패:", error.message || error);
      router.push('/authentication/login');
    }
  };

  useEffect(() => {
    if (!meetingId) {
      router.push('/MeetingGroup/regular-Meeting');
      return;
    }

    if (!userIdx || !token) {
      // userIdx와 token이 아직 설정되지 않았으면 대기
      return;
    }


    const fetchMeetingMembers = async () => {
      try {
        const response = await axiosInstance.get(`/regular-meetings/detail/${meetingId}/members`);
        console.log("모임 멤버 응답 데이터:", response.data);
        // response.data가 배열인지 확인
        if (response.data) {
          setMembers(response.data);
        } else {
          console.error("모임 멤버 정보 요청 실패:", response.data);
          setMembers([]);
        }
      } catch (error) {
        console.error("모임 멤버 정보 가져오기 실패:", error);
        setMembers([]);
      }
    };

    const fetchRecentPhotos = async () => {
      try {
        const response = await axiosInstance.get(`/regular-meetings/detail/${meetingId}/photogallery`);
        console.log("최근 사진 응답 데이터:", response.data);
        if (response.data) {
          setRecentPhotos(response.data);
        } else {
          console.error("최근 사진 요청 실패:", response.data);
          setRecentPhotos([]);
        }
      } catch (error) {
        console.error("최근 사진 가져오기 실패:", error);
        setRecentPhotos([]);
      }
    };

    const fetchPosts = async () => {
      try {
        const response = await axiosInstance.get(`/regular-meetings/detail/${meetingId}/bulletinboard`);
        console.log("게시판 응답 데이터:", response.data);
        if (response.data) {
          setPosts(response.data);
        } else {
          console.error("게시글 요청 실패:", response.data);
          setPosts([]);
        }
      } catch (error) {
        console.error("게시글 가져오기 실패:", error);
        setPosts([]);
      }
    };

    // 모든 데이터 페칭 함수 호출
    fetchMeetingDetails();
    fetchMeetingMembers();
    fetchRecentPhotos();
    fetchPosts();
  }, [meetingId, userIdx, token, router, BASE_URL]);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  //확인
  useEffect(() => {
    if (meeting) {
      console.log("Meeting details:", meeting);
      console.log(typeof userIdx, typeof meeting.leader_idx, userIdx, meeting.leader_idx);
      if (Number(userIdx) === Number(meeting.leader_idx)) {
        console.log("User is the leader of the meeting");
      }
    }
  }, [meeting, userIdx]);

  // 가입하기 창
  const handleJoinMeeting = () => {
    axiosInstance.post(`/regular-meetings/detail/${meetingId}/join`, null, {
      params: { user_idx: userIdx },
    })
      .then(() => {
        alert("가입되었습니다!");
        // 가입 후 다시 서버에서 meeting detail을 불러오기
        fetchMeetingDetails();
      })
      .catch((err) => {
        if (err.response?.status === 409) {
          alert(err.response.data); // "이미 가입된 회원입니다."
        } else {
          console.error(err);
          alert("에러가 발생했습니다.");
        }
      });
  };

  // 탈퇴하기 창
  const handleLeaveMeeting = () => {
    if (!confirm("정말 모임을 탈퇴하시겠습니까?")) return;

    console.log("Leaving meeting:", { meetingId, userIdx });

    axiosInstance.post(`/regular-meetings/detail/${meetingId}/leave`, null, {
      params: { user_idx: userIdx },
    })
      .then(() => {
        alert("모임을 성공적으로 탈퇴했습니다.");
        // 탈퇴 후 서버에서 meeting detail을 다시 불러오기
        fetchMeetingDetails();
      })
      .catch((err) => {
        console.error("모임 탈퇴 실패:", err);
        const errorMsg = err.response?.data || "모임 탈퇴 중 오류가 발생했습니다.";
        alert("모임 탈퇴 중 오류가 발생했습니다.", errorMsg);
      });
  };

  // 수정 모달 열 때(기존 데이터 세팅)
  const openEditModal = () => {
    if (!meeting) return;
    setEditName(meeting.name || "");
    // setEditSelectedFile(meeting.profile_image || ""); // 기존 파일은 null로 설정
    setEditDescription(meeting.description || "");
    setEditRegion(meeting.region || "");
    setEditSubregion(meeting.subregion || "");
    setEditPersonnel(meeting.personnel || 0);

    // 기존 이미지 미리보기
    if (meeting.profile_image) {
      setEditPreviewImage(`${IMAGE_BASE_URL}/${meeting.profile_image}`);
    } else {
      setEditPreviewImage(null);
    }
    // 새 파일은 아직 선택 전
    setEditSelectedFile(null);

    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
  };

  // 5) 수정 API 호출
  const handleUpdateMeeting = async () => {
    if (!confirm("정말 수정하시겠습니까?")) return;

    try {
      const formData = new FormData();
      formData.append("name", editName);
      formData.append("description", editDescription);
      formData.append("region", editRegion);
      formData.append("subregion", editSubregion);
      formData.append("personnel", editPersonnel);
      formData.append("user_idx", userIdx);
      // formData.append("meeting_idx", meeting.meeting_idx);
      formData.append("leader_idx", userIdx);
      formData.append("profile_image", meeting.profile_image); // 기존 이미지 이름

      if (editSelectedFile) {
        formData.append("file", editSelectedFile);
      }

      console.log("Updating meeting with FormData");

      const response = await axiosInstance.put(
        `/regular-meetings/detail/${meeting.meeting_idx}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      alert("모임 수정 완료");
      setEditModalOpen(false);
      // 수정 후 새로고침 or fetchMeetingDetails()
      fetchMeetingDetails();
    } catch (error) {
      console.error("모임 수정 실패:", error);
      alert("수정 도중 오류가 발생했습니다. " + (error.response?.data || ""));
    }
  };

  // 6) 삭제 API 호출
  const handleDeleteMeeting = async () => {
    if (!confirm("정말 모임을 삭제하시겠습니까?")) {
      return;
    }
    try {
      // DELETE /api/regular-meetings/detail/{meetingId}?leader_idx=xxx
      const response = await axiosInstance.delete(`/regular-meetings/detail/${meetingId}`, {
        params: { leader_idx: userIdx },
      });
      alert("모임이 삭제되었습니다.");
      // 목록으로 이동
      router.push("/MeetingGroup/regular-Meeting");
    } catch (error) {
      console.error("모임 삭제 실패:", error);
      alert("삭제 도중 오류가 발생했습니다. " + (error.response?.data || ""));
    }
  };

  // 로딩 상태 관리 추가
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (meeting !== null) {
      setLoading(false);
    }
  }, [meeting, members]);

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  if (!meeting) {
    return <Typography>Loading...</Typography>;
  }

  const host = {
    username: meeting.leader_username,
    name: meeting.name,
    avatar_url: meeting.leader_avatar_url,
    profile_image: meeting.profile_image,
    description: meeting.description,
  };

  // 파일 선택
  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setEditSelectedFile(file);
      setEditPreviewImage(URL.createObjectURL(file));  // 미리보기
    }
  };

  // 멤버 슬라이스 (최대 5명)
  const displayedMembers = Array.isArray(members) ? members.slice(0, 5) : [];
  const remainingMembersCount = Array.isArray(members) ? members.length - displayedMembers.length : 0;

  return (
    <Box sx={{ backgroundColor: "#f8f9fa", padding: "20px 0" }}>
      <Box sx={{ maxWidth: "800px", margin: "0 auto", padding: "0 20px" }}>
        {/* 햄버거 메뉴 */}
        <IconButton
        // meeting.member || Number(userIdx) === Number(meeting.leader_idx)  handleDrawerToggle
        onClick={() => {
          if (meeting.member || Number(userIdx) === Number(meeting.leader_idx)) {
            handleDrawerToggle();
          } else {
            alert("가입이 필요합니다.");
          }
        }}
          sx={{
            position: "fixed",
            bottom: "26px",
            right: "26px",
            backgroundColor: "#28a745",
            color: "white",
            zIndex: 10,
            "&:hover": { backgroundColor: "#218838" },
          }}
        >
          <MenuIcon />
        </IconButton>

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
            <List
              sx={{
                padding: 0,
                margin: 0,
              }}
            >
              {[
                { label: "홈", href: `/MeetingGroup/regular-Meeting/detail/${meetingId}` },
                { label: "게시판", href: `/MeetingGroup/regular-Meeting/detail/${meetingId}/bulletinboard` },
                { label: "사진첩", href: `/MeetingGroup/regular-Meeting/detail/${meetingId}/photogallery` },
                { label: "채팅", href: `/MeetingGroup/regular-Meeting/detail/${meetingId}/chat` },
              ].map((item) => (
                <Link key={item.label} href={item.href} passHref legacyBehavior>
                  <a style={{ textDecoration: "none" }}>
                    <ListItem
                      component="div"
                      onClick={handleDrawerToggle}
                      sx={{
                        textAlign: "center",
                        "&:hover": { backgroundColor: "#dff0d8" },
                        cursor: "pointer",
                      }}
                    >
                      <ListItemText
                        primary={item.label}
                        sx={{
                          textAlign: "center",
                          fontWeight: "bold",
                          color: "#333",
                        }}
                      />
                    </ListItem>
                  </a>
                </Link>
              ))}
            </List>
          </Box>
        </Drawer>

        {/* 상단 배너 */}
        <Box
          sx={{
            position: "relative",
            width: "100%",
            height: "250px",
            backgroundImage: meeting.profile_image
              ? `url(${IMAGE_BASE_URL}/${meeting.profile_image})`
              : `url(/images/cam1.webp)`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            borderRadius: "8px",
          }}
        >
          {/* 프로필과 텍스트 박스 */}
          <Box
            sx={{
              position: "absolute",
              bottom: "-40px",
              left: "50%",
              transform: "translateX(-50%)",
              backgroundColor: "white",
              borderRadius: "8px",
              boxShadow: 2,
              padding: "10px 15px",
              width: "40%",
              textAlign: "center",
            }}
          >
            <Avatar
              src={`${IMAGE_BASE_URL}/${host.avatar_url}`}
              alt={host.username}
              sx={{
                width: 50,
                height: 50,
                margin: "0 auto",
                border: "2px solid white",
                marginBottom: "8px",
              }}
            />
            <Typography
              variant="subtitle1"
              fontWeight="bold"
              sx={{ fontSize: "15px", color: "black" }}
            >
              {host.name}
            </Typography>
            {/* <Typography
              variant="body2"
              color="textSecondary"
              fontWeight="bold"
              sx={{ color: "black" }}
            >
              
            </Typography> */}
          </Box>
        </Box>

        {/* 소글 */}
        <Box sx={{ mt: "70px", textAlign: "center", mb: 3 }}>
          <Typography variant="body2" sx={{ color: "black" }}>

          </Typography>
        </Box>

        {/* 모임 소개 */}
        <Box sx={{ mb: 4, position: 'relative' }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: "bold", color: "black", mb: 2 }}
          >
            모임소개
          </Typography>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            {/* 리더 정보 표시 */}
            <Avatar
              src={`${IMAGE_BASE_URL}/${meeting.leader_avatar_url}`}
              alt={meeting.leader_username}
              sx={{ width: 50, height: 50 }}
            />
            <Box>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ color: "black" }}>
                {meeting.leader_username}
              </Typography>
              <Typography variant="body2" sx={{ color: "black" }}>
                * 장소: {meeting.region}  ·  {meeting.subregion} <br />
                * 정원: {members.length} / {meeting.personnel} <br />
                * 내용: {meeting.description || "안녕하세요. 환영합니다."}

              </Typography>
            </Box>
          </Box>

          {/* 리더만 수정/삭제 버튼 보이기 */}
          {userIdx && meeting && Number(userIdx) === Number(meeting.leader_idx) && (
            <Box sx={{ position: 'absolute', top: '160px' }}>
              <IconButton
                onClick={handleMenuClick}
                sx={{
                  position: "fixed", // 배너의 오른쪽 상단에 고정
                  bottom: "80px",          // 배너 상단에서 10px 내려옴
                  right: "25px",        // 배너 오른쪽에서 10px 안쪽으로 들어옴
                  // backgroundColor: "white", // 아이콘 배경색 (필요 시 조정)
                  color: "#000",            // 아이콘 색상
                  zIndex: 10,               // 다른 요소보다 위로
                  "&:hover": { backgroundColor: "#f0f0f0" }, // 호버 스타일
                }}
              >
                <MoreVertIcon />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={openMenu}
                onClose={handleMenuClose}
                PaperProps={{
                  sx: {
                    boxShadow: 2, // 메뉴의 그림자
                  },
                }}
              >
                <MenuItem onClick={() => { handleMenuClose(); openEditModal(); }}>
                  수정하기
                </MenuItem>
                <MenuItem onClick={() => { handleMenuClose(); handleDeleteMeeting(); }}>
                  삭제하기
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Box>

        {/* 함께할 멤버들 */}
        <Box
          sx={{
            backgroundColor: "#eaffea",
            borderRadius: "8px",
            padding: "15px",
            textAlign: "center",
            boxShadow: 2,
            mb: 4,
          }}
        >
          <Typography
            variant="h6"
            sx={{ fontWeight: "bold", color: "black", mb: 2 }}
          >
            함께할 멤버들
          </Typography>
          <Grid container justifyContent="center" spacing={1}>
            {Array.isArray(displayedMembers) && Number(displayedMembers.length) > 0 ? (
              displayedMembers.map((member) => (
                <Grid item key={member.user_idx}>
                  <Avatar
                    src={`${IMAGE_BASE_URL}/${member.avatar_url}`}
                    alt={member.username}
                    sx={{
                      width: 40,
                      height: 40,
                      border: "1px solid #fff",
                      boxShadow: 1,
                    }}
                  />
                </Grid>
              ))
            ) : (
              <Typography variant="body2" fontWeight="bold" sx={{ mt: 2, color: "black" }}>
                "{host.name}" 모임의 멤버가 없습니다.
              </Typography>
            )}

            {remainingMembersCount > 0 && (
              <Grid item>
                <Avatar
                  sx={{
                    width: 40,
                    height: 40,
                    backgroundColor: "white",
                    border: "1px solid #ccc",
                    color: "#888",
                    fontWeight: "bold",
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                  onClick={openModal} // 클릭 시 모달 열기
                >
                  +{remainingMembersCount}
                </Avatar>
              </Grid>
            )}
          </Grid>

          <Box>
            {Number(userIdx) === Number(meeting.leader_idx) ? (
              <Typography variant="body2" fontWeight="bold" sx={{ mt: 2, color: "black" }}>
                "{userName}" 모임장님, 환영합니다.
              </Typography>
            ) : meeting.member ? (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  mt: 2, // 위쪽 여백 조정
                }}
              >
                <Typography
                  variant="body2"
                  fontWeight="bold"
                  sx={{ color: "black" }}
                >
                  {userName}님, 환영합니다!
                </Typography>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleLeaveMeeting}
                  sx={{
                    position: 'absolute',
                    right: 0,
                    fontSize: "10px",
                    width: "80px",
                    height: "20px",
                    borderColor: "green",
                    color: "green",
                    "&:hover": { backgroundColor: "lightgreen", borderColor: "green" },
                  }}
                >
                  탈퇴하기
                </Button>
              </Box>
            ) : (
              <>
                <Typography variant="body2" fontWeight="bold" sx={{ mt: 2, color: "black" }}>
                  "{host.name}" 모임에 가입해 다양한 추억들을 쌓아보세요!
                </Typography>
                <Button
                  variant="contained"
                  sx={{
                    mt: 2,
                    backgroundColor: "#28a745",
                    color: "white",
                    "&:hover": { backgroundColor: "#218838" },
                  }}
                  onClick={handleJoinMeeting}
                >
                  가입하기
                </Button>
              </>
            )}
          </Box>

          {/* 전체 멤버를 표시하는 모달 */}
          <Modal
            open={modalOpen}
            onClose={closeModal}
            aria-labelledby="member-modal-title"
            aria-describedby="member-modal-description"
          >
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 400,
                bgcolor: 'background.paper',
                border: '2px solid #000',
                boxShadow: 24,
                p: 4,
                borderRadius: '8px',
                maxHeight: '80vh',
                overflowY: 'auto',
              }}
            >
              <Typography id="member-modal-title" variant="h6" component="h2" sx={{ mb: 2 }}>
                모든 멤버
              </Typography>
              <Grid container spacing={2}>
                {Array.isArray(members) && members.length > 0 ? (
                  members.map((member) => (
                    <Grid item xs={4} sm={3} key={member.user_idx} sx={{ textAlign: 'center' }}>
                      <Avatar
                        src={`${IMAGE_BASE_URL}/${member.avatar_url}`}
                        alt={member.username}
                        sx={{ width: 60, height: 60, margin: '0 auto' }}
                      />
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {member.username}
                      </Typography>
                    </Grid>
                  ))
                ) : (
                  <Typography>멤버가 없습니다.</Typography>
                )}
              </Grid>
              <Box sx={{ textAlign: 'right', mt: 2 }}>
                <Button variant="contained" onClick={closeModal} sx={{ backgroundColor: "#28a745", "&:hover": { backgroundColor: "#218838" } }}>
                  닫기
                </Button>
              </Box>
            </Box>
          </Modal>
        </Box>

        {/* 사진첩 */}
        <Box sx={{ mb: 4 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography
              variant="h6"
              sx={{ fontWeight: "bold", color: "black" }}
            >
              사진첩
            </Typography>
            <Button
              endIcon={<ArrowForwardIosIcon fontSize="small" />}
              sx={{
                fontWeight: "bold",
                color: "#28a745",
                "&:hover": { textDecoration: "underline" },
              }}
              onClick={() => {
                if (meeting.member || Number(userIdx) === Number(meeting.leader_idx)) {
                  router.push(`/MeetingGroup/regular-Meeting/detail/${meetingId}/photogallery`);
                } else {
                  alert("가입한 멤버만 접근 가능합니다.");
                }
              }}
            >
              더보기
            </Button>

          </Box>
          <Grid container spacing={2}>
            {Array.isArray(recentPhotos) && recentPhotos.length > 0 ? (
              recentPhotos.map((photo) => (
                <Grid item xs={12} sm={6} key={photo.image_idx}>
                  <Card
                    sx={{
                      boxShadow: 2,
                    }}
                  >
                    <CardMedia
                      component="img"
                      height="200"
                      image={`${BASE_URL}/uploads/${photo.image_url}`}
                      alt={`사진 ${photo.image_idx}`}
                      onError={(e) => { e.target.src = '/images/camping1.png'; }}
                    />
                  </Card>
                </Grid>
              ))
            ) : (
              <Typography>최근 사진이 없습니다.</Typography>
            )}
          </Grid>
        </Box>

        {/* 게시판 */}
        <Box sx={{ mb: 4 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography
              variant="h6"
              sx={{ fontWeight: "bold", color: "black" }}
            >
              게시판
            </Typography>
            <Button
              endIcon={<ArrowForwardIosIcon fontSize="small" />}
              sx={{
                fontWeight: "bold",
                color: "#28a745",
                "&:hover": { textDecoration: "underline" },
              }}
              onClick={() => {
                if (meeting.member || Number(userIdx) === Number(meeting.leader_idx)) {
                  router.push(`/MeetingGroup/regular-Meeting/detail/${meetingId}/bulletinboard`);
                } else {
                  alert("가입이 필요합니다.");
                }
              }}
            >
              더보기
            </Button>

          </Box>
          {Array.isArray(posts) && posts.length > 0 ? (
            posts.map((post) => (
              <Link
                key={post.board_idx}
                href={`/MeetingGroup/regular-Meeting/detail/${meetingId}/bulletinboard/${post.board_idx}`}
                passHref
              >
                <Card
                  sx={{
                    mb: 2,
                    padding: "10px",
                    borderRadius: "8px",
                    boxShadow: 2,
                    cursor: "pointer",
                    "&:hover": { backgroundColor: "#f0f0f0" },
                  }}
                >
                  <CardContent>
                    <Typography
                      variant="subtitle1"
                      fontWeight="bold"
                      sx={{ color: "black" }}
                    >
                      {post.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "black" }}>
                      {post.category} · {new Date(post.uploaded_at).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Link>
            ))
          ) : (
            <Typography>게시글이 없습니다.</Typography>
          )}
        </Box>
      </Box>

      {/* 수정 모달 */}
      <Dialog open={editModalOpen} onClose={closeEditModal} fullWidth maxWidth="sm">
        <DialogTitle>모임 수정하기</DialogTitle>
        <DialogContent>
          <TextField
            label="모임 제목"
            fullWidth
            variant="outlined"
            sx={{ mt: 2 }}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />
          {/* 이미지 미리보기 */}
          {editPreviewImage && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                기존/새 프로필 미리보기
              </Typography>
              <Avatar
                src={editPreviewImage}
                alt="Selected Profile"
                sx={{ width: 100, height: 100, margin: '0 auto' }}
              />
            </Box>
          )}

          {/* 파일 선택 버튼 */}
          <Box sx={{ mt: 2 }}>
            <Button variant="contained" component="label" color="success">
              새 프로필 사진 선택
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleImageChange}
              />
            </Button>
          </Box>

          <TextField
            label="모임 설명"
            fullWidth
            multiline
            rows={5}
            variant="outlined"
            sx={{ mt: 2 }}
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
          />
          <TextField
            label="지역"
            fullWidth
            variant="outlined"
            sx={{ mt: 2 }}
            value={editRegion}
            onChange={(e) => setEditRegion(e.target.value)}
          />
          <TextField
            label="세부 지역"
            fullWidth
            variant="outlined"
            sx={{ mt: 2 }}
            value={editSubregion}
            onChange={(e) => setEditSubregion(e.target.value)}
          />
          <TextField
            label="정원"
            type="number"
            fullWidth
            variant="outlined"
            sx={{ mt: 2 }}
            value={editPersonnel}
            onChange={(e) => setEditPersonnel(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEditModal} sx={{ color: "#333" }}>
            취소
          </Button>
          <Button variant="contained" onClick={handleUpdateMeeting} sx={{ backgroundColor: "#28a745" }}>
            수정하기
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}