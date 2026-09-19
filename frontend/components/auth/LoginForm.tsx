"use client"

import Link from "next/link";
import { useState } from "react";
import { EyeClosed, EyeIcon } from "lucide-react";




export function LoginForm() {
  const [email, setEmail] = useState<string>()
  const [password, setPassword] = useState<string>()
  const [error,setError] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const [showPassword, setShowPassord] =useState<boolean>(false)



  async function handleLogin(event:React.SubmitEvent<HTMLFormElement>){
    event.preventDefault();

    setLoading(true)
    setError('')

    try{
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method:"POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password
        }),
      })

      const data = await response.json();

      if(!response.ok){
        throw new Error(
          data.message || 'Error Authorization'
        )
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
    }catch(error){
      if(error instanceof Error){
        setError(error.message)
      }else{
        setError('Undifindet error')
      }
    }

    finally{
      setLoading(false)
    }
  }

  return(
    <div className="flex items-center justify-center h-screen">
      <form onSubmit={handleLogin} method="post" className="rounded-2xl w-150 h-200 auth-card">
        <div className="flex flex-col px-14 py-25">
            <h2 className="text-[45px] font-semibold mb-10 text-center">Sign in</h2>

          <label htmlFor="email" className="text-[17px] mb-1">Email address</label><br />
          <input 
            type="email" 
            name="email" 
            id="email" 
            placeholder="Enter your email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="border-1 border-[#2F31221A] rounded-lg py-1.5 px-6 mb-5"
          />

          <div>
            <label htmlFor="password" className="text-[17px] mb-1">
              Password

              <Link href={'/'}>
                Forgot Password?
              </Link>
            </label>
          </div>
          
          <div>
            <input 
              type={showPassword? 'text':'password'}
              name="password" 
              id="password"
              placeholder="Enter your password"
              value={password}
              onChange={(event)=>setPassword(event.target.value)}
              className="border-1 border-[#2F31221A] rounded-lg py-1.5 px-6 mb-5"
            />
            <button 
              type="button"
              onClick={() => setShowPassord(prev => !prev)}
              arie-label={showPassword? 'hide password':'show password'}
            >
              {showPassword? <EyeClosed />:<EyeIcon/>}
            </button>

          </div>
          
          {error&&<p>{error}</p>} <br />

          <button 
            type="submit"
            disabled={loading}
          >
            {loading ? 'Loading in':'login'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default LoginForm;
