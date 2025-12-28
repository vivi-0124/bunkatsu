"use client";
import { useEffect, useState } from "react";
import { Header } from "@/components/header";

export default function Home() {
  const [message, setMessage] = useState();

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("/api/hello");
      const { message } = await res.json();
      setMessage(message);
    };
    fetchData();
  }, []);

  if (!message) return <p>Loading...</p>;

  return (
    <>
      <Header />
      <p>{message}</p>
    </>
  );
}
