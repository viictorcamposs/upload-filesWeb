import { useState, useEffect } from 'react';
import { uniqueId } from 'lodash';
import filesize from 'filesize';

import api from './services/api';
import Upload from './components/Upload';
import FileList from './components/FileList';

import GlobalStyle from './styles/global';
import { Container, Content } from './styles';

function App() {
  const [UploadedFiles, setUploadedFiles] = useState([]);

  useEffect(() => {
    async function loadFiles() {
      const response = await api.get('posts');
  
      const data = response.data.map(file => ({
        id: file._id,
        name: file.name,
        readableSize: filesize(file.size),
        preview: file.url,
        uploaded: true,
        url: file.url,
      }));

      setUploadedFiles(data);
    }

    loadFiles()
  }, []);

  useEffect(() => {
    return () => {
      UploadedFiles.forEach(file => URL.revokeObjectURL(file.preview));
    };
  }, [UploadedFiles]);

  const updateFile = (id, data) => {
    setUploadedFiles(state => state.map(uploadedFile => {
      if(id === uploadedFile.id) return { ...uploadedFile, ...data };

      return uploadedFile;
    }));
  };

  const processUpload = async uploadedFile => {
    try {
      const data = new FormData();
      
      if(!uploadedFile.file) return;

      data.append('file', uploadedFile.file, uploadedFile.name);

      const response = await api.post('posts', data, {
        onUploadProgress: e => {
          const progress = Math.round((e.loaded * 100) / e.total);

          updateFile(uploadedFile.id, { progress })
        }
      });

      updateFile(uploadedFile.id, {
        uploaded: true,
        id: response.data._id,
        url: response.data.url,
      });
    } catch (error) {
      updateFile(uploadedFile.id, {
        error: true,
      });
    }
  };

  const handleUpload = (files) => {
    const formatedFiles = files.map(file => ({
      file,
      id: uniqueId(),
      name: file.name,
      readableSize: filesize(file.size),
      preview: URL.createObjectURL(file),
      progress: 0,
      uploaded: false,
      error: false,
      url: null,
    }));

    const newUpdatedFiles = [...UploadedFiles, ...formatedFiles];

    setUploadedFiles(newUpdatedFiles);
    formatedFiles.forEach(processUpload);
  };

  const handleDelete = async id => {
    await api.delete(`posts/${id}`);

    setUploadedFiles(files => files.filter(file => file.id !== id));
  };

  return (
    <Container>
      <Content>
        <Upload onUpload={handleUpload} />
        {!!UploadedFiles.length && (
          <FileList files={UploadedFiles} onDelete={handleDelete} />
        )}
      </Content>
      <GlobalStyle /> 
    </Container>
  );
}

export default App;
