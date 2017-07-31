class DocumentsController < ApplicationController
    before_filter :authorize, only: :index
	
	def index
		@title = "Treeva : : Documentos"
		@documents = Document.getDocumentsByUserId_orderByUpdated(current_user.id)
  	end

	def show
		if current_user
			@documents = Document.getDocumentsByUserId_orderByUpdated(current_user.id)
		end
		render :layout => false
	end

	def open
		document = Document.find(params[:id])
		render json: document
	end

	def create
		document = Document.create(current_user.id, params)
		if document.validate
			render json: document
		else
			render json: {errors: document.errors}
		end
	end

	def edit
		document = Document.getDocumentById(params[:id])
		render json: document
	end

	def updateName
		document = Document.updateName(params)
		if document.validate
			render json: document
		else
			render json: {errors: document.errors}
		end
	end

	def updateContent
		document = Document.updateContent(params)
		if document.validate
			render json: document
		else
			render json: {errors: document.errors}
		end
	end

	def delete
		Document.deletes(params[:ids])
		render json: {}
	end

	def document
		@documents = Document.getDocumentsByUserId_orderByUpdated(current_user.id)
	    respond_to do |format|
	    	format.html 
	    	format.js
	    end
	end

	def getDocumentsOrderByName
		@documents = Document.getDocumentsByUserId_orderByName(current_user.id)
	   	respond_to do |format|
	    	format.html 
	    	format.js { render "document.js.erb" }
	    end
	end
end
