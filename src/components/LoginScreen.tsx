import React, { useState } from "react";
import { Music, Mail, Lock, User, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";
import PixelReveal from "./PixelReveal";

interface LoginScreenProps {
  onLogin: (name: string, email: string) => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Preencha todos os campos");
      return;
    }
    if (isSignUp && !name.trim()) {
      setError("Informe seu nome");
      return;
    }
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setIsLoading(true);

    // Simula delay de autenticacao
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const userName = isSignUp ? name.trim() : email.split("@")[0];
    onLogin(userName, email.trim());
  };

  return (
    <div className="h-full w-full flex items-center justify-center bg-black relative overflow-hidden">
      {/* Pixel Reveal background */}
      <PixelReveal
        imageSrc="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1920&auto=format&fit=crop&q=80"
        gridSize={18}
        transitionColor="#000000"
        edgeHeight={15}
        duration={2.5}
        direction="up"
      />

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Gradient accents */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#1db954]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#1db954]/8 rounded-full blur-[100px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-[#1db954] rounded-full flex items-center justify-center mb-4 shadow-lg shadow-[#1db954]/20">
            <Music className="w-8 h-8 text-black" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Spotify</h1>
        </div>

        {/* Card */}
        <div className="bg-[#181818] rounded-2xl border border-[#2a2a2a] p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-1">
            {isSignUp ? "Criar conta" : "Entrar"}
          </h2>
          <p className="text-sm text-zinc-400 mb-6">
            {isSignUp
              ? "Cadastre-se para começar a ouvir"
              : "Bem-vindo de volta!"}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Name field (sign up only) */}
            {isSignUp && (
              <div>
                <label className="text-xs text-gray-400 uppercase font-semibold mb-1 block">
                  Nome
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full bg-[#2a2a2a] border border-[#3e3e3e] rounded-lg pl-10 pr-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#1db954] focus:border-transparent transition"
                  />
                </div>
              </div>
            )}

            {/* Email field */}
            <div>
              <label className="text-xs text-gray-400 uppercase font-semibold mb-1 block">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full bg-[#2a2a2a] border border-[#3e3e3e] rounded-lg pl-10 pr-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#1db954] focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label className="text-xs text-gray-400 uppercase font-semibold mb-1 block">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#2a2a2a] border border-[#3e3e3e] rounded-lg pl-10 pr-10 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#1db954] focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
                <p className="text-red-400 text-xs font-medium">{error}</p>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#1db954] hover:bg-[#1ed760] disabled:opacity-60 disabled:cursor-not-allowed text-black font-bold py-3 rounded-full text-sm transition flex items-center justify-center gap-2 mt-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isSignUp ? "Criando conta..." : "Entrando..."}
                </>
              ) : (
                <>
                  {isSignUp ? "Criar conta" : "Entrar"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[#3e3e3e]" />
            <span className="text-xs text-zinc-500">ou</span>
            <div className="flex-1 h-px bg-[#3e3e3e]" />
          </div>

          {/* Toggle login/signup */}
          <p className="text-center text-sm text-zinc-400">
            {isSignUp ? "Já tem uma conta?" : "Não tem uma conta?"}{" "}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
              }}
              className="text-[#1db954] hover:text-[#1ed760] font-semibold transition cursor-pointer"
            >
              {isSignUp ? "Fazer login" : "Cadastre-se"}
            </button>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-zinc-600 mt-6">
          Continuando, você concorda com os Termos de Uso e Política de Privacidade.
        </p>
      </div>
    </div>
  );
}
