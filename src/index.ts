import { useEffect, useMemo, useState } from 'react'

export type DragFn = (e: DragEvent) => void

export const useDragFile = (props?: {
  onDrop?: DragFn
  onDragover?: DragFn
  onDragenter?: DragFn
}) => {
  const [dropFiles, setDropFiles] = useState<DropFile[]>([])
  const dragEvents = useMemo(() => {
    const dragenter = (e: DragEvent) => {
      e.preventDefault()
      props && props.onDragenter && props.onDragenter(e)
    }
    const dragover = (e: DragEvent) => {
      e.preventDefault()
      props && props.onDragover && props.onDragover(e)
    }
    const drop = async (e: DragEvent) => {
      e.preventDefault()
      const dropFiles = await getFiles(e)
      setDropFiles(dropFiles)
      props && props.onDrop && props.onDrop(e)
    }
    return {
      dragenter,
      dragover,
      drop,
    }
  }, [])

  useEffect(() => {
    document.body.addEventListener('dragenter', dragEvents.dragenter)
    document.body.addEventListener('dragover', dragEvents.dragover)
    document.body.addEventListener('drop', dragEvents.drop)
    return () => {
      document.body.removeEventListener('dragenter', dragEvents.dragenter)
      document.body.removeEventListener('dragover', dragEvents.dragover)
      document.body.removeEventListener('drop', dragEvents.drop)
    }
  }, [dragEvents])

  return {
    dropFiles,
  }
}

export interface DropFile {
  file: File
  fullPath: string
}

// 读取文件入口
async function readFileEntrySync(entry: FileEntry): Promise<File> {
  return new Promise((resolve) => {
    entry.file((file) => {
      resolve(file)
    })
  })
}
// 读取文件夹入口
async function readDirEntrySync(entry: FileEntry): Promise<FileEntry[]> {
  return new Promise((resolve) => {
    const fileEntries: FileEntry[] = []
    const dirReader: DirectoryReader = (entry as any).createReader()
    dirReader.readEntries((entries) => {
      entries.forEach((entry) => {
        fileEntries.push(entry as FileEntry)
      })
      resolve(fileEntries)
    })
  })
}

// https://stackoverflow.com/questions/28487352/dragndrop-datatransfer-getdata-empty/28487486
// 保存入口 由于 DataTransfer 只在 drop的时间段存在, 所以需要提前收集文件信息
export const savedEntries = (e: DragEvent): FileEntry[] => {
  //const entries: FileEntry[] = []
  const items = e.dataTransfer && e.dataTransfer.items
  if (!items) {
    return []
  }
  return Array.from(items).map((item) => item.webkitGetAsEntry())
}

// 处理入口文件
async function readEntry(fileEntry: FileEntry) {
  let files: DropFile[] = []
  if (fileEntry.isFile) {
    const file = await readFileEntrySync(fileEntry)
    files.push({
      file,
      fullPath: fileEntry.fullPath,
    })
  } else if (fileEntry.isDirectory) {
    const fileEntries = await readDirEntrySync(fileEntry)
    for (let i = 0; i < fileEntries.length; i++) {
      const entry = fileEntries[i]
      if (entry.isFile) {
        const file = await readFileEntrySync(fileEntries[i])
        files.push({
          file,
          fullPath: fileEntry.fullPath,
        })
      } else {
        files = files.concat(await readEntry(entry))
      }
    }
  }
  return files
}

async function getFiles(e: DragEvent) {
  let dropFiles: DropFile[] = []

  const entries = savedEntries(e)
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]
    dropFiles = dropFiles.concat(await readEntry(entry))
  }
  return dropFiles
}
