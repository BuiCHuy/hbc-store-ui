import React from "react";
import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { AIChatbot } from "./AIChatbot";

export function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative">
      <Header />
      <main className="flex-grow">
        <Outlet /> 
      </main>
      <AIChatbot />
    </div>
  );
}