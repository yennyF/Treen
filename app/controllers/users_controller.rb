class UsersController < ApplicationController
    before_filter :authorize

	def index
		@title = "Treeva : : Usuarios"
		#@users = User.all.order(updated_at: :desc)
		@users = User.getUsersOrderByUpdated(current_user.id)
		@user = User.new
  	end

	def create
		#user = User.new(params.require(:user).permit(:rol, :username, :password, :email, :occupation))
		#user.save
		user = User.create(params[:user])
		if user.validate
			render json: user
		else
			#Rails.logger.debug("My object: #{user.errors.full_messages}")
			render json: {errors: user.errors}
		end
	end

	def edit
		@user = User.getUserById(params[:id]);
		respond_to do |format|
	    	format.html 
	    	format.js
	    end
	end

	def setting
		@title = "Treeva : : Cuenta"
		@user = User.getUserById(current_user.id);
	end

	def update
		user = User.update(params[:user])
		if user.validate
			render json: user
		else
			render json: {errors: user.errors}
		end
	end

	def updatePersonal
		user = User.updatePersonal(params[:user])
		if user.validate
			render json: user
		else
			render json: {errors: user.errors}
		end
	end

	def updatePassword
		user = User.updatePassword(params[:user])
		if user.validate
			render json: user
		else
			render json: {errors: user.errors}
		end
	end

	def delete
		User.deletes(params[:ids])
		render json: {}
	end

	def user
		@users = User.getUsersOrderByUpdated(current_user.id)
	    respond_to do |format|
	    	format.html 
	    	format.js
	    end
	end

	def getUsersOrderByUsername
		@users = User.getUsersOrderByUsername(current_user.id)
		#@users.each do |user|
		#	Rails.logger.debug("My object: #{user.documents.length}")
		#end 
	   	respond_to do |format|
	    	format.html 
	    	format.js { render "user.js.erb" }
	    end
	end

	def getUsersOrderByEmail
		@users = User.getUsersOrderByEmail(current_user.id)
	   	respond_to do |format|
	    	format.html 
	    	format.js { render "user.js.erb" }
	    end
	end

	def getUsersOrderByOccupation
		@users = User.getUsersOrderByOccupation(current_user.id)
	   	respond_to do |format|
	    	format.html 
	    	format.js { render "user.js.erb" }
	    end
	end

	def getUsersOrderByRol
		@users = User.getUsersOrderByRol(current_user.id)
	   	respond_to do |format|
	    	format.html 
	    	format.js { render "user.js.erb" }
	    end
	end
end
