from livereload import Server

# Serve files from current directory
server = Server()

# Watch all HTML, CSS, and JS files in this folder
server.watch('*.html')
server.watch('*.css')
server.watch('*.js')

# Start the server on port 8000
server.serve(root='.', port=8000)
