import React, { useCallback, useEffect, useState } from 'react';
import Quill from 'quill';
import io from 'socket.io-client';
import 'quill/dist/quill.snow.css';
import { useParams } from 'react-router-dom';

const serverUrl = 'http://localhost:2000';
const SAVE_INTERVAL_MS = 2000;

const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ font: [] }],
  [{ list: 'ordered' }, { list: 'outlet' }],
  ['bold', 'italic', 'underline'],
  [{ script: 'sub' }, { script: 'super' }],
  [{ align: [] }],
  ['image', 'blockquote', 'code-block'],
  ['clean'],
];

const TextEditor = () => {
  // const wrapperRef = useRef();

  const { id: documentID } = useParams();
  const [socket, setSocket] = useState();
  const [quill, setQuill] = useState();

  // for saving docs
  useEffect(() => {
    if (socket == null || quill == null) return;
    const interval = setInterval(() => {
      socket.emit('save-document', quill.getContents());
    }, SAVE_INTERVAL_MS);

    return () => {
      clearInterval(interval);
    };
  }, [socket, quill]);

  // for getting a particular document
  useEffect(() => {
    if (socket == null || quill == null) return;
    // listen to this event only once
    socket.once('load-document', (document) => {
      // disable text editor until document is loaded
      quill.setContents(document);
      quill.enable();
    });
    // send docId to server
    socket.emit('get-document', documentID);
  }, [socket, quill, documentID]);

  // for initial connection to socket
  useEffect(() => {
    const s = io(serverUrl);
    setSocket(s);
    return () => {
      s.disconnect();
    };
  }, []);
  // pass changes to server socket
  useEffect(() => {
    if (socket == null || quill == null) return;
    const handler = (delta, oldDeta, source) => {
      if (source !== 'user') return;
      // this emits a message from our client to our server
      // the delta is a small subtset of what changes in our doc
      socket.emit('send-changes', delta);
    };
    // whenever quill has text that changes, we send that up to our server
    quill.on('text-change', handler);

    return () => {
      quill.off('text-change', handler);
    };
  }, [socket, quill]);

  useEffect(() => {
    if (socket == null || quill == null) return;
    const handler = (delta) => {
      // recieve broadcasted changes , then update document state
      quill.updateContents(delta);
    };
    // whenever quill has text that changes, we send that up to our server
    socket.on('recieve-changes', handler);

    return () => {
      quill.off('recieve-changes', handler);
    };
  }, [socket, quill]);

  const wrapperRef = useCallback((wrapper) => {
    if (wrapper == null) return;
    wrapper.innerHTML = '';
    const editor = document.createElement('div');
    wrapper.append(editor);
    const q = new Quill(editor, {
      theme: 'snow',
      modules: {
        toolbar: TOOLBAR_OPTIONS,
      },
    });
    q.disable();
    q.setText('Loading......');
    setQuill(q);
  }, []);

  return <div className="container" ref={wrapperRef}></div>;
};

export default TextEditor;
