"use client"
import { Box } from '@mui/material'
import React from 'react'
import EmailVerificationForm from '../../../../component/EmailVerificaionForm'
import useEmailVerification from '../../../../authentication/signUp/hooks/useEmailVerification'

export default function ChangePassword() {

    const emailVerificaion = useEmailVerification();

    return (
        <Box sx={{
            display:'flex',
            flexDirection:'column',
            alignItems:'center',
            alignContent: 'center'
        }}>
            <EmailVerificationForm {...emailVerificaion}/>
        </Box>
    )
}