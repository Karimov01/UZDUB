"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
export default function VisitorTracker(){const path=usePathname();useEffect(()=>{if(!path)return;const send=()=>fetch("/api/public/analytics",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({path,referrer:document.referrer}),keepalive:true}).catch(()=>{});const idle=window.requestIdleCallback?.(send,{timeout:2500});const timeout=idle===undefined?window.setTimeout(send,1200):undefined;return()=>{if(idle!==undefined)window.cancelIdleCallback?.(idle);if(timeout!==undefined)window.clearTimeout(timeout)}},[path]);return null}
