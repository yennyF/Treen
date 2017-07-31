class Document < ApplicationRecord
    belongs_to :user

	validates :name, 
		presence: {message: "Requerido"},
		length: {in: 1..255, message: "Debe contener entre 1 a 255 caracteres"}

	def as_json(options = {})
		super(options.merge({ except: [:content] }))
		super.merge('updated_at' => self.updated_at.strftime("%d %b %Y - %I:%M %P"),
					'created_at' => self.updated_at.strftime("%d %b %Y - %I:%M %P"))
	end

	def self.create(user_id, params)
		user = User.where(["id = ?", user_id]).first
		#Rails.logger.debug("My object: #{params.key?(:content)}")
		if params.key?(:content)
	  		document = user.documents.create(name: params[:name], content: params[:content])
	  	else
	  		document = user.documents.create(name: params[:name])
	  	end
	  	return document
	end

	def self.updateName(params)
		document = Document.find(params[:id])
		document.name = params[:name]
		#isChanged = (document.changed.length > 0) ? true : false
		document.save
		return document
	end

	def self.updateContent(params)
		document = Document.where(["id = ?", params[:id]]).first
		document.content = params[:content]
		document.save
		return document
	end

	def self.deletes(ids)	
		documents = Document.find(ids)
		documents.each do |document|
			document.destroy
		end
	end

	def self.getDocumentById(id)
		return Document.where(["id = ?", id]).first
	end

	def self.getDocumentsByUserId_orderByUpdated(user_id)
		return Document.where(["user_id = ?", user_id]).order(updated_at: :desc)
	end

	def self.getDocumentsByUserId_orderByName(user_id)
		return Document.where(["user_id = ?", user_id]).order(name: :asc)
	end
end
