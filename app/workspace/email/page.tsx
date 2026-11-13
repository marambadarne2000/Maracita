'use client';
import {translateLabel,uiLocale} from '@/lib/ui-translate';
import { useEffect } from 'react';
export default function EmailPage(){useEffect(()=>location.replace('/workspace/messages'),[]);return <p>{translateLabel("Opening the unified inbox…")}</p>;}
