class User < ApplicationRecord
    has_many :documents, dependent: :destroy
	has_secure_password

	validates :username, 
		presence: {message: "Requerido"},
		length: {in: 5..10, message: "Debe contener entre 5 a 10 caracteres"},
		format: {with: /\A[a-z0-9]+\z/, message: "Solo caracteres alfanuméricos minúsculos"},
		uniqueness: {message: "El usuario ya ha sido utilizado"}

	# update user without password
	# http://stackoverflow.com/questions/16811530/devise-3-rails-4-cant-update-user-without-password
	validates :password, 
		on: :create,
		presence: {message: "Requerido"},
		format: {with: /\A[a-zA-Z0-9(!@#$%&?)]+\z/, message: "Solo caracteres alfanuméricos y/o !@#$%&?"},
		length: {is: 5, message: "Debe contener 5 caracteres"}

	validates :password, 
		on: :update,
		allow_blank: true,
		format: {with: /\A[a-zA-Z0-9(!@#$%&?)]+\z/, message: "Solo caracteres alfanuméricos y/o !@#$%&?"},
		length: {is: 5, message: "Debe contener 5 caracteres"}

	validates :email, 
		presence: {message: "Requerido"},
		format: {with: /\A[\w+\-.]+@[a-z\d\-.]+\.[a-z]+\z/, message: "Correo electrónico no válido"}

	validates :rol, 
		presence: {message: "Requerido"},
		inclusion: {in: %w(admin user), message: "No es un rol válido"}

	# Using the built-in serialization, you can override the as_json method on your model to pass in additional default options:
	def as_json(options = {})
		super(options.merge({ except: [:password_digest] }))
		super.merge('updated_at' => self.updated_at.strftime("%d %b %Y"),
					'created_at' => self.updated_at.strftime("%d %b %Y"))
	end
	# or put in controller user.as_json(except: [:password_digest])

	def self.create(params)
		user = User.new
		user.rol = params[:rol]
		user.username = params[:username]
		user.password = params[:password]
		user.email = params[:email]
		user.occupation = params[:occupation]
		user.save
		return user
	end

	def self.update(params)
		user = User.find(params[:id])
		user.rol = params[:rol]
		user.username = params[:username]
		user.email = params[:email]
		user.occupation = params[:occupation]
		#isChanged = (user.changed.length > 0) ? true : false
		user.save
		return user
	end

	def self.updatePersonal(params)
		user = User.find(params[:id])
		user.email = params[:email]
		user.occupation = params[:occupation]
		#isChanged = (user.changed.length > 0) ? true : false
  		user.save
		return user
	end

	def self.updatePassword(params)
		user = User.find(params[:id])
		user.password = params[:password]
		#isChanged = (user.changed.length > 0) ? true : false
  		user.save
		return user
	end

	def self.deletes(ids)
		#Rails.logger.debug("My object: #{ids}")
		users = User.find(ids)
		users.each do |user|
		#	documents = Document.where(user_id: user.id)
		#	documents.each do |document|
		#		document.destroy
		#	end
			user.destroy
		end
	end

	def self.getUserById(id)
		return User.where(["id = ?", id]).first
	end

	def self.getUserByUsername(username)
		return User.where(["username = ?", username]).first
	end

	def self.getUsersOrderByUpdated(current_user_id)
		return User.where.not(id: current_user_id).order(updated_at: :desc)
	end

	def self.getUsersOrderByUsername(current_user_id)
		return User.where.not(id: current_user_id).order(username: :asc)
	end

	def self.getUsersOrderByEmail(current_user_id)
		return User.where.not(id: current_user_id).order(email: :asc)
	end

	def self.getUsersOrderByOccupation(current_user_id)
		return User.where.not(id: current_user_id).order(occupation: :asc)
	end

	def self.getUsersOrderByRol(current_user_id)
		return User.where.not(id: current_user_id).order(rol: :asc)
	end	
end
