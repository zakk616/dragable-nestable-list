"use strict";

const dnlConsts = 
{
    classes : {
        topLi:"dnl-list",
        titleSpan:"dnl-title"
    }
}

class dnlConfig
{
    grabber = true;
    indexing = true;
}

class DraggableNestableList
{
    topLvlUl = null;

    constructor(selector, config = new dnlConfig())
    {
        this.topLvlUl = $(selector);

        this.topLvlUl.addClass(dnlConsts.classes.topLi);

        // Every Li
        this.topLvlUl.find("li").each((i,e)=>{
            let li = $(e);

            let nestedUl = li.children("ul").first()?.remove();

            let oldLiHtml = li.html();

            let titleSpan = document.createElement("span");
            titleSpan.classList.add(dnlConsts.classes.titleSpan);

            if(config.grabber)
            {
                titleSpan.insertAdjacentHTML("beforeEnd", `
                    <span class="dnl-graber">
                        <span class="material-icons dnl-grab-icon">open_with</span>
                        ${config.indexing ? `
                            <span>
                                <span class="dnl-index"></span>
                                ${oldLiHtml}
                            </span>
                        `: oldLiHtml}
                    </span>
                `);
            }
            else
            {
                titleSpan.insertAdjacentHTML("beforeEnd", `
                    ${config.indexing ? `
                        <span>
                            <span class="dnl-index"></span>
                            ${oldLiHtml}
                        </span>
                    `: oldLiHtml}
                `); 
            }

            li.html(titleSpan)

            li.append(nestedUl);

            return;
        });

        // Nested Ul s
        this.topLvlUl.find("ul").each((i,e)=>{
            let nUl = $(e);

            let parentLi = nUl.closest("li");
            parentLi.addClass("dnl-has-nested-ul");
            parentLi.children(dnlConsts.classes.titleSpan.clas()).first().append(`<span class="material-icons dnl-icon-collapsed">chevron_left</span><span class="material-icons dnl-icon-expanded">expand_more</span>`);

        });

        // Dragging Logic
        this.topLvlUl.on("click", ".dnl-has-nested-ul", (e)=>{
            // Dont toggle list if user clicks on drag icon
            e.stopPropagation();

            if(e.target.classList.value.includes("dnl-grab-icon")) return;

            $(e.target).closest("li").toggleClass("dnl-section-open");
        });

        
        let RealLi = null;
        let CloneLiBeingDragged = null;
        let DraggingLiLevel = null;

        this.topLvlUl.on("mousemove","li",  (e)=>{

            // getting the closest parent li if a child of li emits this event
            let li = jQuery(e.target).closest("li");

            $(".dnlHovering").removeClass("dnlHovering");
            $(li).addClass("dnlHovering");


            // jQuery(".potentialLi").removeClass("potentialLi");

            // Check if an Item is being Dragged and the li user is hovering over is the sibling of dragged li
            if(CloneLiBeingDragged && RealLi.parent()[0] == li.parent()[0]) 
                $(li).addClass("potentialNewSpotLi");

        });

        this.topLvlUl.on("mouseleave","li",  (e)=>{
            // if(jQuery(e.target).data("lvl") != DraggingLiLevel && CloneLiBeingDragged != null) return;

            jQuery(".dnlHovering").removeClass("dnlHovering");
            jQuery(".potentialNewSpotLi").removeClass("potentialNewSpotLi");
        });


        // Using a Graber
        // jQuery("body").on("mousedown",".liGraber",  (e)=>{
        //     e.stopPropagation();

        //     RealLi = jQuery(e.target).closest("li");

        //     DraggingLiLevel = RealLi.data("lvl");

        //     CloneLiBeingDragged = RealLi.clone();

        //     jQuery(CloneLiBeingDragged).addClass("dargingItem");
        //     jQuery(".MainList").append(CloneLiBeingDragged);
        // });

        this.topLvlUl.on("mousedown","li",  (e)=>{
            e.stopPropagation();

            if(config.grabber && !$(e.target).hasClass("dnl-grab-icon"))
            {
                console.log("Cancelled grab because cursor not on icon.")
                return;
            }


            this.topLvlUl.css("user-select","none")

            RealLi = $(e.target).closest("li");

            // DraggingLiLevel = RealLi.data("lvl");

            CloneLiBeingDragged = RealLi.clone();

            $(CloneLiBeingDragged).addClass("cloneLiBeingDragged");

            $(e.target).closest("ul").append(CloneLiBeingDragged);
        });

        $("body").on("mousemove",  (e)=>{
            e.stopPropagation();

            if(!CloneLiBeingDragged) return;

            $(".cloneLiBeingDragged").css({
                "top":e.clientY+"px",
                "left":e.clientX+"px",
                "width": RealLi[0].getBoundingClientRect().width,
                "height": RealLi[0].getBoundingClientRect().height,
                "display":RealLi.css("display")
            });

            if(jQuery(".potentialNewSpotLi").length)
            {
                let PotentialNewSpotLi = $(".potentialNewSpotLi");

                var rect = PotentialNewSpotLi[0].getBoundingClientRect();
                var y = e.clientY - rect.top;  //y position within the element.
                var h = rect.height;

                if((y/h) < .5)
                {
                    PotentialNewSpotLi.removeClass("bottom");
                    PotentialNewSpotLi.addClass("top");
                }
                else{
                    PotentialNewSpotLi.addClass("bottom");
                    PotentialNewSpotLi.removeClass("top");
                }
            }

        });
        
        $("body").on("mouseup", (e)=>{
            e.stopPropagation();

            if($(".potentialNewSpotLi").length)
            {
                let PotentialNewSpotLi = $(".potentialNewSpotLi");
                
                var rect = PotentialNewSpotLi[0].getBoundingClientRect();
                var y = e.clientY - rect.top;  //y position within the element.
                var h = rect.height;

                if((y/h) < .5)
                {
                    PotentialNewSpotLi.before(RealLi[0]);
                }
                else
                    PotentialNewSpotLi.after(RealLi[0]);

                this.indexLis(this.topLvlUl);
            }

            CloneLiBeingDragged?.remove();
            CloneLiBeingDragged = null;
            $(".cloneLiBeingDragged").removeClass("cloneLiBeingDragged");

        });

        this.indexLis(this.topLvlUl);
    }

    indexLis(ul) 
    {  
        ul.children("li").each((i,e)=>{
            $(e).find(".dnl-index").first().text(`${i + 1}. `);

            if($(e).children("ul").length)
                this.indexLis($(e).children("ul").first());
        });
    }
}

// Returns the string with . prepended
Object.defineProperty(String.prototype, "clas", {
	value: function clas() {
        return "."+this;
	},
	writable: true,
	configurable: true
});
