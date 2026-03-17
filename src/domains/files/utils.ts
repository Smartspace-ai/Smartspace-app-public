import { FileArchive, FileAudio, FileCode, FileImage, FileSpreadsheet, FileText, FileVideo, Presentation } from "lucide-react";

export const getFileIcon=(fileName: string)=>{
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg','jpeg','png','gif','bmp','webp','svg'].includes(ext || '')) return FileImage;
    if (['mp4','avi','mov','wmv','flv','webm','mkv'].includes(ext || '')) return FileVideo;
    if (['mp3','wav','flac','aac','ogg','wma'].includes(ext || '')) return FileAudio;
    if (['zip','rar','7z','tar','gz','bz2'].includes(ext || '')) return FileArchive;
    if (['js','ts','jsx','tsx','py','java','cpp','c','cs','php','html','css','json','xml','md'].includes(ext || '')) return FileCode;
    if (['xlsx','xls','csv'].includes(ext || '')) return FileSpreadsheet;
    if (['pptx','ppt'].includes(ext || '')) return Presentation;
    return FileText;
  }
  