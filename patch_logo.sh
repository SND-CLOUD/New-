sed -i '/const reader = new FileReader();/,/reader.readAsDataURL(file);/ c\
                                          const reader = new FileReader();\n\
                                          reader.onloadend = () => {\n\
                                            const img = new Image();\n\
                                            img.onload = () => {\n\
                                              const canvas = document.createElement("canvas");\n\
                                              const MAX_WIDTH = 300;\n\
                                              const MAX_HEIGHT = 300;\n\
                                              let width = img.width;\n\
                                              let height = img.height;\n\
                                              if (width > height) {\n\
                                                if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }\n\
                                              } else {\n\
                                                if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }\n\
                                              }\n\
                                              canvas.width = width;\n\
                                              canvas.height = height;\n\
                                              const ctx = canvas.getContext("2d");\n\
                                              ctx?.drawImage(img, 0, 0, width, height);\n\
                                              setLogoUrl(canvas.toDataURL("image/jpeg", 0.7));\n\
                                            };\n\
                                            img.src = reader.result as string;\n\
                                          };\n\
                                          reader.readAsDataURL(file);' src/components/Settings.tsx
