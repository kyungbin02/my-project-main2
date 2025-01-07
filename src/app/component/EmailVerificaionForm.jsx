import { Box, Button, Grid, Typography } from "@mui/material"
import InputForm from "./InputForm"
import useEmailVerification from "../authentication/signUp/hooks/useEmailVerification";

function EmailVerificationForm({
    email,
    verificationCode,
    verificationSent,
    emailVerified,
    countdown,
    handleEmailChange,
    handleVerificationCodeChange,
    sendVerificationCode,
    verifyCode,
}){

    return(
        <Box
            sx={{
                background: "#fff",
                padding: "30px 20px",
                borderRadius: "10px",
                width: '500px',
                mb: "20px",
            }}
            className="bg-black"
        >
            <Grid container alignItems="center" spacing={2}>
                <InputForm
                    label="이메일"
                    name="email"
                    value={email}
                    onChange={handleEmailChange}
                    disabled={emailVerified}
                />
                <Button
                    fullWidth
                    variant="contained"
                    sx={{
                        mt: 2,
                        mb: 2,
                        textTransform: "capitalize",
                        borderRadius: "8px",
                        fontWeight: "500",
                        fontSize: "16px",
                        ml:"20px",
                        mr:"2px",
                        padding: "10px 10px",
                        color: "#fff !important",
                    }}
                    onClick={sendVerificationCode}
                    disabled={emailVerified}
                >
                인증번호 보내기
                </Button>
                <InputForm
                    label="인증 코드"
                    name="verificationCode"
                    value={verificationCode}
                    onChange={handleVerificationCodeChange}
                />
                <Button
                    fullWidth
                    variant="contained"
                    sx={{
                        mt: 2,
                        mb: 2,
                        textTransform: "capitalize",
                        borderRadius: "8px",
                        fontWeight: "500",
                        fontSize: "16px",
                        ml:"20px",
                        mr:"2px",
                        padding: "10px 10px",
                        color: "#fff !important",
                    }}
                    onClick={verifyCode}
                    disabled={emailVerified}
                >
                    인증번호 확인
                </Button>
                <Typography color="textSecondary" sx={{ mt: 3, ml: 3 }}>
                    {emailVerified
                        ? '인증 완료되었습니다.'
                        : verificationSent
                        ? `인증 코드가 이메일로 발송되었습니다. 남은 시간: ${Math.floor(countdown / 60)}:${countdown % 60}`
                        : null}
                </Typography>
            </Grid>
        </Box>
    )
}


export default EmailVerificationForm;