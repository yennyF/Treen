class HomeController < ApplicationController
	def index
		render :layout => false
	end

	def recoverUser
		render plain: params[:user].inspect
	end

	def createUser
		params[:user][:rol] = 'user'
		user = User.create(params[:user])
		if user.validate
			session[:user_id] = user.id
			#render json: user
			#render json: {}
			redirect_to controller: 'documents'
		else
			#Rails.logger.debug("My object: #{user.errors.full_messages}")
			render json: {errors: user.errors}
		end
	end
end
