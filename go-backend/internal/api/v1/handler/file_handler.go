package handler

import (
	"fmt"
	"io"
	"log/slog"
	"net/http"

	"go-backend/internal/fileservice"

	"github.com/go-chi/chi/v5"
)

type FileHandler struct {
	fileService fileservice.FileService
}

func NewFileHandler(fileService fileservice.FileService) *FileHandler {
	return &FileHandler{
		fileService: fileService,
	}
}

// UploadFile handles file upload via binary body
func (h *FileHandler) UploadFile(w http.ResponseWriter, r *http.Request) {
	fileName := r.URL.Query().Get("fileName")
	if fileName == "" {
		http.Error(w, "fileName query parameter is required", http.StatusBadRequest)
		return
	}

	content, err := io.ReadAll(r.Body)
	if err != nil {
		slog.Error("Error reading file content from request body", "error", err)
		http.Error(w, "error in reading file content from request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	if len(content) == 0 {
		http.Error(w, "file content is empty", http.StatusBadRequest)
		return
	}

	err = h.fileService.UpsertFile(fileName, content)
	if err != nil {
		slog.Error("Error in uploading file", "error", err, "fileName", fileName)
		http.Error(w, "error in uploading file to database", http.StatusInternalServerError)
		return
	}

	downloadURL := h.fileService.GetDownloadURL(fileName)

	response := map[string]string{
		"message":     "File uploaded successfully.",
		"downloadUrl": downloadURL,
	}

	if err := writeJSON(w, http.StatusCreated, response); err != nil {
		slog.Error("Failed to write JSON response", "error", err)
		http.Error(w, "failed to write response", http.StatusInternalServerError)
	}
}

// DeleteFile handles file deletion by fileName
func (h *FileHandler) DeleteFile(w http.ResponseWriter, r *http.Request) {
	fileName := r.URL.Query().Get("fileName")
	if fileName == "" {
		http.Error(w, "fileName query parameter is required", http.StatusBadRequest)
		return
	}

	err := h.fileService.DeleteFile(fileName)
	if err != nil {
		slog.Error("Error in deleting file", "error", err, "fileName", fileName)
		http.Error(w, "error in deleting file from database", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// DownloadMicroAppFile handles public file download
// Note: This handler is only called when FileServiceType is "db", so the service will always be DBFileService
func (h *FileHandler) DownloadMicroAppFile(w http.ResponseWriter, r *http.Request) {
	fileName := chi.URLParam(r, "fileName")
	if fileName == "" {
		http.Error(w, "fileName parameter is required", http.StatusBadRequest)
		return
	}

	dbService := h.fileService.(*fileservice.DBFileService)

	content, err := dbService.GetBlobContent(fileName)
	if err != nil {
		if err.Error() == "record not found" {
			slog.Warn("Micro App file not found", "fileName", fileName)
			http.Error(w, "Micro App file not found for the given file name", http.StatusNotFound)
			return
		}
		slog.Error("Error occurred while retrieving Micro App file", "error", err, "fileName", fileName)
		http.Error(w, "Error occurred while retrieving Micro App file", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/octet-stream")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", fileName))
	w.WriteHeader(http.StatusOK)

	if _, err := w.Write(content); err != nil {
		slog.Error("Failed to write file content", "error", err, "fileName", fileName)
	}
}
