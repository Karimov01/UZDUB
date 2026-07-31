"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
export default function VisitorTracker(){const path=usePathname();useEffect(()=>{if(!path)return;fetch("/api/public/analytics",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({path,referrer:document.referrer})}).catch(()=>{})},[path]);return null}
