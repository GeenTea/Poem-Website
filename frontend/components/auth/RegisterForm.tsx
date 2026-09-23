'use client'

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { EyeClosed, EyeIcon } from "lucide-react";


export function RegisterForm() {
  // TODO: реализовать
  const [username,setUserName] = useState<string>("")
  const [email, setEmail] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [repeatPassword, setRepeatPassword] =useState<string>("")
  const [displayName, setDisplayName] = useState("")
  const [error,setError] = useState<string[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [showPassword, setShowPassword] =useState<boolean>(false)
  const router = useRouter()
  const passwordsMatch = password === repeatPassword


  


  async function handleLogin(event:React.SubmitEvent<HTMLFormElement>){
    event.preventDefault();

    setLoading(true)
    setError([])

    try{
      if(!passwordsMatch){
        setError(['Your password does not match the confirmation.'])
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        method:"POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          email,
          password,
          displayName:displayName || undefined,
        }),
      })

      const data = await response.json();

      if(!response.ok){
        const message = Array.isArray(data.message)? data.message:[data.message]
        setError(message)
        return
      }

      console.log('Authorize successfull')


      localStorage.setItem(
        'accessToken',
        data.accessToken,
      )

      localStorage.setItem(
        'refreshToken',
        data.refreshToken
      )

      router.replace('/')
    }catch(error){
      if(error instanceof Error){
        setError(prev=>[...prev,error.message])
      }else{
        setError(prev=>[...prev,'Undifindet error'])
      }
    }

    finally{
      setLoading(false)
    }
  }

  return(
    <div className="flex items-center justify-center h-screen">
      <form onSubmit={handleLogin} method="post" className="rounded-2xl w-150 auth-card">
        <div className="flex flex-col px-14 py-25 gap-3">
          <h2 className="text-[45px] font-semibold mb-10 text-center">Sign up</h2>

          <label htmlFor="displayName" className="text-[17px]">Display name</label>
          <input 
            type="text" 
            name="displayName" 
            id="displayName" 
            placeholder="Enter display name"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            className="border border-[#2F31221A] rounded-lg py-1.5 px-6 w-full"
          />

          <label htmlFor="username" className="text-[17px]">Username</label>
          <input 
            type="text" 
            name="username" 
            id="username" 
            placeholder="Enter username"
            value={username}
            onChange={(event) => setUserName(event.target.value)}
            className="border border-[#2F31221A] rounded-lg py-1.5 px-6 w-full"
          />

          <label htmlFor="email" className="text-[17px]">Email address</label>
          <input 
            type="email" 
            name="email" 
            id="email" 
            placeholder="Enter your email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="border border-[#2F31221A] rounded-lg py-1.5 px-6 w-full"
          />

          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-[17px]">Password</label>
          </div>

          
          <div className="relative">
            <input 
              type={showPassword? 'text':'password'}
              name="password" 
              id="password"
              placeholder="Enter your password"
              value={password}
              onChange={(event)=>setPassword(event.target.value)}
              className="border border-[#2F31221A] rounded-lg py-1.5 px-6 pr-11  w-full"
            />
            <button 
              type="button"
              onClick={() => setShowPassword(prev => !prev)}
              aria-label={showPassword? 'hide password':'show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              {showPassword? <EyeClosed />:<EyeIcon/>}
            </button>
          </div>

          {/*Repet Password*/}

          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-[17px]">Repet Password</label>
          </div>

          
          <div className="relative">
            <input 
              type={showPassword? 'text':'password'}
              name="password" 
              id="password"
              placeholder="Enter your password"
              value={repeatPassword}
              onChange={(event)=>setRepeatPassword(event.target.value)}
              className="border border-[#2F31221A] rounded-lg py-1.5 px-6 pr-11  w-full"
            />
            <button 
              type="button"
              onClick={() => setShowPassword(prev => !prev)}
              aria-label={showPassword? 'hide password':'show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              {showPassword? <EyeClosed />:<EyeIcon/>}
            </button>
          </div>

          <div>
            <Link href={'/login'} className="text-[15px] hover:text-red-400">
              I have account
            </Link>
          </div>
          
          {error&&error.map((message, index)=>(
            <div key={index}>
              <p className="text-[var(--berry)] w-full max-w-md">{message}</p>
            </div>
              )
            )
          }

          <button 
            type="submit"
            disabled={loading}
            className="hover:cursor-pointer mt-4 bg-[var(--berry)] w-full py-6 text-amber-50 rounded-2xl hover:opacity-90 font-bold text-[20px] "
          >
            {loading ? 'Loading in':'Register'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default RegisterForm;
